import {cleanupOld, createEntry} from './time-to-live.js';
import type {Entry} from './time-to-live.js';
import type {ExtendedStore} from './type.js';

export class TtlKeyValueInMemory<K extends string, V> implements ExtendedStore<K, V> {
	get ttlSupport() {
		return true;
	}

	readonly #inMemoryStorage = new Map<K, Entry<V>>();

	constructor(
		cleanupIntervalMilliseconds: number = 5 * 60 * 1000,
	) {
		if (Number.isFinite(cleanupIntervalMilliseconds) && cleanupIntervalMilliseconds > 0) {
			setInterval(async () => this.#cleanupOld(), cleanupIntervalMilliseconds);
		}
	}

	keys(): readonly K[] {
		return [...this.#inMemoryStorage.keys()];
	}

	get(key: K): V | undefined {
		const now = Date.now();
		const entry = this.#inMemoryStorage.get(key);
		if (entry?.until && entry.until > now) {
			return entry.value;
		}

		return undefined;
	}

	set(key: K, value: V, ttl?: number): void {
		this.#inMemoryStorage.set(key, createEntry(value, ttl));
	}

	delete(key: K): boolean {
		return this.#inMemoryStorage.delete(key);
	}

	clear(): void {
		this.#inMemoryStorage.clear();
	}

	async #cleanupOld(): Promise<void> {
		await cleanupOld(this.#inMemoryStorage, key => this.delete(key));
	}
}
