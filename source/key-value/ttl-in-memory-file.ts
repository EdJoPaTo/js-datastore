import {readFileSync, unlinkSync, existsSync} from 'fs'

import {Entry, createEntry, cleanupOld} from './time-to-live'
import {ExtendedStore} from './type'

import writeJsonFile = require('write-json-file')

export class TtlKeyValueInMemoryFile<T> implements ExtendedStore<T> {
	readonly ttlSupport = true

	private readonly _inMemoryStorage: Map<string, Entry<T>> = new Map()

	constructor(
		private readonly _filepath: string,
		cleanupIntervalMilliseconds: number = 5 * 60 * 1000
	) {
		if (existsSync(this._filepath)) {
			const raw = readFileSync(this._filepath, 'utf8')
			const json = JSON.parse(raw)
			for (const [key, value] of Object.entries(json)) {
				this._inMemoryStorage.set(key, value as Entry<T>)
			}
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
		this._inMemoryStorage.set(key, createEntry(value, ttl))
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

	private async _cleanupOld(): Promise<void> {
		await cleanupOld(this._inMemoryStorage, async key => this.delete(key))
	}

	private _createFileContent(): Record<string, unknown> {
		const json: Record<string, unknown> = {}
		for (const [key, value] of this._inMemoryStorage.entries()) {
			json[key] = value
		}

		return json
	}
}
