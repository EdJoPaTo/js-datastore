import {existsSync, readFileSync, unlinkSync} from 'node:fs';
import {writeJsonFile} from '../write.js';
import type {ExtendedStore} from './type.js';

export class KeyValueInMemoryFile<K extends string, V> implements ExtendedStore<K, V> {
	get ttlSupport() {
		return false;
	}

	readonly #inMemoryStorage = new Map<K, V>();

	constructor(
		private readonly filepath: string,
	) {
		if (existsSync(this.filepath)) {
			const raw = readFileSync(this.filepath, 'utf8');
			const json = JSON.parse(raw) as V[];
			for (const [key, value] of Object.entries(json)) {
				this.#inMemoryStorage.set(key as K, value);
			}
		}
	}

	keys(): readonly K[] {
		return [...this.#inMemoryStorage.keys()];
	}

	get(key: K): V | undefined {
		return this.#inMemoryStorage.get(key);
	}

	async set(key: K, value: V): Promise<void> {
		this.#inMemoryStorage.set(key, value);
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

	#createFileContent(): Record<string, unknown> {
		return Object.fromEntries(this.#inMemoryStorage.entries());
	}
}
