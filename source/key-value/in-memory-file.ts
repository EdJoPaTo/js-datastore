import {readFileSync, unlinkSync, existsSync} from 'fs'

import {Dictionary, KeyValueStorage} from './type'

import writeJsonFile = require('write-json-file')

export class KeyValueInMemoryFile<T> implements KeyValueStorage<T> {
	private _inMemoryStorage: Dictionary<T> = {}

	constructor(
		private readonly _filepath: string
	) {
		if (existsSync(this._filepath)) {
			const raw = readFileSync(this._filepath, 'utf8')
			const json = JSON.parse(raw)
			this._inMemoryStorage = json
		}
	}

	entries(): Dictionary<T> {
		return this._inMemoryStorage
	}

	keys(): readonly string[] {
		return Object.keys(this._inMemoryStorage)
	}

	get(key: string): T | undefined {
		return this._inMemoryStorage[key]
	}

	async set(key: string, value: T): Promise<void> {
		this._inMemoryStorage[key] = value
		await writeJsonFile(this._filepath, this._inMemoryStorage, {sortKeys: true})
	}

	delete(key: string): void {
		delete this._inMemoryStorage[key]
		if (JSON.stringify(this._inMemoryStorage) === '{}' && existsSync(this._filepath)) {
			unlinkSync(this._filepath)
		}
	}
}
