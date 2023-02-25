import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	unlinkSync,
} from 'node:fs';
import {writeJsonFile} from '../write.js';
import type {ExtendedStore} from './type.js';

export class KeyValueInMemoryFiles<K extends string, V> implements ExtendedStore<K, V> {
	get ttlSupport() {
		return false;
	}

	readonly #inMemoryStorage = new Map<K, V>();

	constructor(
		private readonly directory: string,
	) {
		mkdirSync(directory, {recursive: true});

		const entries = this.#listFromFilesystem();
		for (const entry of entries) {
			this.#inMemoryStorage.set(entry, this.#getFromFilesystem(entry));
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
		await writeJsonFile(this.#pathOfKey(key), value);
	}

	delete(key: K): boolean {
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

	#pathOfKey(key: K): string {
		return `${this.directory}/${key}.json`;
	}

	#listFromFilesystem(): readonly K[] {
		return readdirSync(this.directory)
			.map(o => o.replace('.json', '') as K);
	}

	#getFromFilesystem(key: K): V {
		const content = readFileSync(this.#pathOfKey(key), 'utf8');
		return JSON.parse(content) as V;
	}
}
