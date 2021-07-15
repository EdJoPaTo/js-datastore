import {readFileSync, unlinkSync, existsSync} from 'fs'

import writeJsonFile from 'write-json-file'

import {Entry, createEntry, cleanupOld} from './time-to-live'
import {ExtendedStore} from './type'

export class TtlKeyValueInMemoryFile<T> implements ExtendedStore<T> {
	get ttlSupport() {
		return true
	}

	readonly #inMemoryStorage = new Map<string, Entry<T>>()

	constructor(
		private readonly filepath: string,
		cleanupIntervalMilliseconds: number = 5 * 60 * 1000,
	) {
		if (existsSync(this.filepath)) {
			const raw = readFileSync(this.filepath, 'utf8')
			const json = JSON.parse(raw) as Array<Entry<T>>
			for (const [key, value] of Object.entries(json)) {
				this.#inMemoryStorage.set(key, value)
			}
		}

		if (cleanupIntervalMilliseconds && Number.isFinite(cleanupIntervalMilliseconds) && cleanupIntervalMilliseconds > 0) {
			setInterval(async () => this.#cleanupOld(), cleanupIntervalMilliseconds)
		}
	}

	keys(): readonly string[] {
		return [...this.#inMemoryStorage.keys()]
	}

	get(key: string): T | undefined {
		const now = Date.now()
		const entry = this.#inMemoryStorage.get(key)
		if (entry?.until && entry.until > now) {
			return entry.value
		}

		return undefined
	}

	async set(key: string, value: T, ttl?: number): Promise<void> {
		this.#inMemoryStorage.set(key, createEntry(value, ttl))
		await writeJsonFile(this.filepath, this.#createFileContent(), {sortKeys: true})
	}

	async delete(key: string): Promise<boolean> {
		const result = this.#inMemoryStorage.delete(key)
		if (this.#inMemoryStorage.size > 0) {
			await writeJsonFile(this.filepath, this.#createFileContent(), {sortKeys: true})
		} else if (existsSync(this.filepath)) {
			unlinkSync(this.filepath)
		}

		return result
	}

	clear(): void {
		this.#inMemoryStorage.clear()
		if (existsSync(this.filepath)) {
			unlinkSync(this.filepath)
		}
	}

	async #cleanupOld(): Promise<void> {
		await cleanupOld(this.#inMemoryStorage, async key => this.delete(key))
	}

	#createFileContent(): Record<string, unknown> {
		const json: Record<string, unknown> = {}
		for (const [key, value] of this.#inMemoryStorage.entries()) {
			json[key] = value
		}

		return json
	}
}
