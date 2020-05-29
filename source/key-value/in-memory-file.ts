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
			const json = JSON.parse(raw)
			const keys = Object.keys(json)
			for (const key of keys) {
				this._inMemoryStorage.set(key, json[key])
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
		const json: Record<string, T> = {}
		for (const key of this._inMemoryStorage.keys()) {
			json[key] = this._inMemoryStorage.get(key)!
		}

		await writeJsonFile(this._filepath, json, {sortKeys: true})
	}

	delete(key: string): boolean {
		const result = this._inMemoryStorage.delete(key)
		if (this._inMemoryStorage.size === 0 && existsSync(this._filepath)) {
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
}
