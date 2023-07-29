import {existsSync, readFileSync, unlinkSync} from 'node:fs';
import {writeJsonFile} from '../write.js';
import {cleanupOld, createEntry, type Entry} from './time-to-live.js';
import type {ExtendedStore} from './type.js';

export class TtlKeyValueInMemoryFile<K extends string, V> implements ExtendedStore<K, V> {
	get ttlSupport() {
		return true;
	}

	readonly #inMemoryStorage = new Map<K, Entry<V>>();

	constructor(
		private readonly filepath: string,
		cleanupIntervalMilliseconds: number = 5 * 60 * 1000,
	) {
		if (existsSync(this.filepath)) {
			const raw = readFileSync(this.filepath, 'utf8');
			const json = JSON.parse(raw) as Array<Entry<V>>;
			for (const [key, value] of Object.entries(json)) {
				this.#inMemoryStorage.set(key as K, value);
			}
		}

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

	async set(key: K, value: V, ttl?: number): Promise<void> {
		this.#inMemoryStorage.set(key, createEntry(value, ttl));
		await writeJsonFile(this.filepath, this.#createFileContent());
	}

	async delete(key: K): Promise<boolean> {
		const result = this.#inMemoryStorage.delete(key);
		if (this.#inMemoryStorage.size > 0) {
			await writeJsonFile(this.filepath, this.#createFileContent());
		} else if (existsSync(this.filepath)) {
			unlinkSync(this.filepath);
		}

		return result;
	}

	clear(): void {
		this.#inMemoryStorage.clear();
		if (existsSync(this.filepath)) {
			unlinkSync(this.filepath);
		}
	}

	async #cleanupOld(): Promise<void> {
		await cleanupOld(this.#inMemoryStorage, async key => this.delete(key));
	}

	#createFileContent(): Record<string, unknown> {
		return Object.fromEntries(this.#inMemoryStorage.entries());
	}
}
