import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	unlinkSync,
} from 'node:fs';
import {writeJsonFile} from '../write.js';
import {cleanupOld, createEntry} from './time-to-live.js';
import type {Entry} from './time-to-live.js';
import type {ExtendedStore} from './type.js';

export class TtlKeyValueInMemoryFiles<T> implements ExtendedStore<T> {
	get ttlSupport() {
		return true;
	}

	readonly #inMemoryStorage = new Map<string, Entry<T>>();

	constructor(
		private readonly directory: string,
		cleanupIntervalMilliseconds: number = 5 * 60 * 1000,
	) {
		mkdirSync(directory, {recursive: true});

		const entries = this.#listFromFilesystem();
		for (const entry of entries) {
			this.#inMemoryStorage.set(entry, this.#getFromFilesystem(entry));
		}

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

	async set(key: string, value: T, ttl?: number): Promise<void> {
		const entry = createEntry(value, ttl);
		this.#inMemoryStorage.set(key, entry);
		await writeJsonFile(this.#pathOfKey(key), entry);
	}

	delete(key: string): boolean {
		const result = this.#inMemoryStorage.delete(key);
		if (existsSync(this.#pathOfKey(key))) {
			unlinkSync(this.#pathOfKey(key));
		}

		return result;
	}

	clear(): void {
		for (const key of this.keys()) {
			this.delete(key);
		}
	}

	#pathOfKey(key: string): string {
		return `${this.directory}/${key}.json`;
	}

	#listFromFilesystem(): readonly string[] {
		return readdirSync(this.directory)
			.map(o => o.replace('.json', ''));
	}

	#getFromFilesystem(key: string): Entry<T> {
		const content = readFileSync(this.#pathOfKey(key), 'utf8');
		const json = JSON.parse(content) as Entry<T>;
		return json;
	}

	async #cleanupOld(): Promise<void> {
		await cleanupOld(this.#inMemoryStorage, key => this.delete(key));
	}
}
