import {Entry, createEntry, cleanupOld} from './time-to-live'
import {ExtendedStore} from './type'

export class TtlKeyValueInMemory<T> implements ExtendedStore<T> {
	get ttlSupport() {
		return true
	}

	private readonly _inMemoryStorage = new Map<string, Entry<T>>()

	constructor(
		cleanupIntervalMilliseconds: number = 5 * 60 * 1000,
	) {
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

	set(key: string, value: T, ttl?: number): void {
		this._inMemoryStorage.set(key, createEntry(value, ttl))
	}

	delete(key: string): boolean {
		return this._inMemoryStorage.delete(key)
	}

	clear(): void {
		this._inMemoryStorage.clear()
	}

	private async _cleanupOld(): Promise<void> {
		await cleanupOld(this._inMemoryStorage, key => this.delete(key))
	}
}
