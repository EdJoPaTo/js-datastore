import {existsSync, readFileSync, unlinkSync} from 'node:fs';
import {writeJsonFile} from '../write.js';
import type {ExtendedStore} from './type.js';

export class KeyValueInMemoryFile<T> implements ExtendedStore<T> {
	get ttlSupport() {
		return false;
	}

	readonly #inMemoryStorage = new Map<string, T>();

	constructor(
		private readonly filepath: string,
	) {
		if (existsSync(this.filepath)) {
			const raw = readFileSync(this.filepath, 'utf8');
			const json = JSON.parse(raw) as T[];
			for (const [key, value] of Object.entries(json)) {
				this.#inMemoryStorage.set(key, value);
			}
		}
	}

	keys(): readonly string[] {
		return [...this.#inMemoryStorage.keys()];
	}

	get(key: string): T | undefined {
		return this.#inMemoryStorage.get(key);
	}

	async set(key: string, value: T): Promise<void> {
		this.#inMemoryStorage.set(key, value);
		await writeJsonFile(this.filepath, this.#createFileContent());
	}

	async delete(key: string): Promise<boolean> {
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
		const json: Record<string, unknown> = {};
		for (const [key, value] of this.#inMemoryStorage.entries()) {
			json[key] = value;
		}

		return json;
	}
}
