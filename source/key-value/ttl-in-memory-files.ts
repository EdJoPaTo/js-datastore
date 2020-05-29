import {mkdirSync, readdirSync, readFileSync, unlinkSync, existsSync} from 'fs'

import {Entry, createEntry, cleanupOld} from './time-to-live'
import {ExtendedStore} from './type'

import writeJsonFile = require('write-json-file')

export class TtlKeyValueInMemoryFiles<T> implements ExtendedStore<T> {
	readonly ttlSupport = false

	private readonly _inMemoryStorage: Map<string, Entry<T>> = new Map()

	constructor(
		private readonly _directory: string,
		cleanupIntervalMilliseconds: number = 5 * 60 * 1000
	) {
		mkdirSync(_directory, {recursive: true})

		const entries = this._listFromFS()
		for (const entry of entries) {
			this._inMemoryStorage.set(entry, this._getFromFS(entry))
		}

		if (cleanupIntervalMilliseconds && Number.isFinite(cleanupIntervalMilliseconds) && cleanupIntervalMilliseconds > 0) {
			setInterval(async () => this._cleanupOld(), cleanupIntervalMilliseconds)
		}
	}

	keys(): readonly string[] {
		return [...this._inMemoryStorage.keys()]
	}

	get(key: string): T | undefined {
		const now = Date.now()
		const entry = this._inMemoryStorage.get(key)
		if (entry?.until && entry.until > now) {
			return entry.value
		}

		return undefined
	}

	async set(key: string, value: T, ttl?: number): Promise<void> {
		const entry = createEntry(value, ttl)
		this._inMemoryStorage.set(key, entry)
		await writeJsonFile(this._pathOfKey(key), entry, {sortKeys: true})
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

	private _getFromFS(key: string): Entry<T> {
		const content = readFileSync(this._pathOfKey(key), 'utf8')
		const json = JSON.parse(content)
		return json
	}

	private async _cleanupOld(): Promise<void> {
		await cleanupOld(this._inMemoryStorage, key => this.delete(key))
	}
}
