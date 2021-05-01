import {readFileSync, unlinkSync, existsSync} from 'fs'

import {ExtendedStore} from './type'

import writeJsonFile = require('write-json-file')

export class KeyValueInMemoryFile<T> implements ExtendedStore<T> {
	readonly ttlSupport = false

	private readonly _inMemoryStorage: Map<string, T> = new Map()

	constructor(
		private readonly _filepath: string
	) {
		if (existsSync(this._filepath)) {
			const raw = readFileSync(this._filepath, 'utf8')
			const json = JSON.parse(raw) as T[]
			for (const [key, value] of Object.entries(json)) {
				this._inMemoryStorage.set(key, value)
			}
		}
	}

	keys(): readonly string[] {
		return [...this._inMemoryStorage.keys()]
	}

	get(key: string): T | undefined {
		return this._inMemoryStorage.get(key)
	}

	async set(key: string, value: T): Promise<void> {
		this._inMemoryStorage.set(key, value)
		await writeJsonFile(this._filepath, this._createFileContent(), {sortKeys: true})
	}

	async delete(key: string): Promise<boolean> {
		const result = this._inMemoryStorage.delete(key)
		if (this._inMemoryStorage.size > 0) {
			await writeJsonFile(this._filepath, this._createFileContent(), {sortKeys: true})
		} else if (existsSync(this._filepath)) {
			unlinkSync(this._filepath)
		}

		return result
	}

	clear(): void {
		this._inMemoryStorage.clear()
		if (existsSync(this._filepath)) {
			unlinkSync(this._filepath)
		}
	}

	private _createFileContent(): Record<string, unknown> {
		const json: Record<string, unknown> = {}
		for (const [key, value] of this._inMemoryStorage.entries()) {
			json[key] = value
		}

		return json
	}
}
