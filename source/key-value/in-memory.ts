import type {ExtendedStore} from './type.js';

export class KeyValueInMemory<T> implements ExtendedStore<T> {
	get ttlSupport() {
		return false;
	}

	readonly #inMemoryStorage = new Map<string, T>();

	keys(): readonly string[] {
		return [...this.#inMemoryStorage.keys()];
	}

	get(key: string): T | undefined {
		return this.#inMemoryStorage.get(key);
	}

	set(key: string, value: T): void {
		this.#inMemoryStorage.set(key, value);
	}

	delete(key: string): boolean {
		return this.#inMemoryStorage.delete(key);
	}

	clear(): void {
		this.#inMemoryStorage.clear();
	}
}
