import type {ExtendedStore} from './type.js';

export class KeyValueInMemory<K extends string, V> implements ExtendedStore<K, V> {
	get ttlSupport() {
		return false;
	}

	readonly #inMemoryStorage = new Map<K, V>();

	keys(): readonly K[] {
		return [...this.#inMemoryStorage.keys()];
	}

	get(key: K): V | undefined {
		return this.#inMemoryStorage.get(key);
	}

	set(key: K, value: V): void {
		this.#inMemoryStorage.set(key, value);
	}

	delete(key: K): boolean {
		return this.#inMemoryStorage.delete(key);
	}

	clear(): void {
		this.#inMemoryStorage.clear();
	}
}
