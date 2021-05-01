import {mkdirSync, readdirSync, readFileSync, unlinkSync, existsSync} from 'fs'

import {ExtendedStore} from './type'

import writeJsonFile = require('write-json-file')

export class KeyValueInMemoryFiles<T> implements ExtendedStore<T> {
	get ttlSupport() {
		return false
	}

	private readonly _inMemoryStorage: Map<string, T> = new Map()

	constructor(
		private readonly _directory: string
	) {
		mkdirSync(_directory, {recursive: true})

		const entries = this._listFromFS()
		for (const entry of entries) {
			this._inMemoryStorage.set(entry, this._getFromFS(entry))
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
		await writeJsonFile(this._pathOfKey(key), value, {sortKeys: true})
	}

	delete(key: string): boolean {
		const result = this._inMemoryStorage.delete(key)
		if (existsSync(this._pathOfKey(key))) {
			unlinkSync(this._pathOfKey(key))
		}

		return result
	}

	clear(): void {
		for (const key of this.keys()) {
			this.delete(key)
		}
	}

	private _pathOfKey(key: string): string {
		return `${this._directory}/${key}.json`
	}

	private _listFromFS(): readonly string[] {
		return readdirSync(this._directory)
			.map(o => o.replace('.json', ''))
	}

	private _getFromFS(key: string): T {
		const content = readFileSync(this._pathOfKey(key), 'utf8')
		const json = JSON.parse(content)
		return json
	}
}
