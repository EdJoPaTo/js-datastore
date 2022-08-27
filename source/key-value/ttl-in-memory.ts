import {cleanupOld, createEntry} from './time-to-live.js';
import type {Entry} from './time-to-live.js';
import type {ExtendedStore} from './type.js';

export class TtlKeyValueInMemory<T> implements ExtendedStore<T> {
	get ttlSupport() {
		return true;
	}

	readonly #inMemoryStorage = new Map<string, Entry<T>>();

	constructor(
		cleanupIntervalMilliseconds: number = 5 * 60 * 1000,
	) {
		if (cleanupIntervalMilliseconds && Number.isFinite(cleanupIntervalMilliseconds) && cleanupIntervalMilliseconds > 0) {
			setInterval(async () => this.#cleanupOld(), cleanupIntervalMilliseconds);
		}
	}

	keys(): readonly string[] {
		return [...this.#inMemoryStorage.keys()];
	}

	get(key: string): T | undefined {
		const now = Date.now();
		const entry = this.#inMemoryStorage.get(key);
		if (entry?.until && entry.until > now) {
			return entry.value;
		}

		return undefined;
	}

	set(key: string, value: T, ttl?: number): void {
		this.#inMemoryStorage.set(key, createEntry(value, ttl));
	}

	delete(key: string): boolean {
		return this.#inMemoryStorage.delete(key);
	}

	clear(): void {
		this.#inMemoryStorage.clear();
	}

	async #cleanupOld(): Promise<void> {
		await cleanupOld(this.#inMemoryStorage, key => this.delete(key));
	}
}
