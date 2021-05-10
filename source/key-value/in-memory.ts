import {ExtendedStore} from './type'

export class KeyValueInMemory<T> implements ExtendedStore<T> {
	get ttlSupport() {
		return false
	}

	private readonly _inMemoryStorage = new Map<string, T>()

	keys(): readonly string[] {
		return [...this._inMemoryStorage.keys()]
	}

	get(key: string): T | undefined {
		return this._inMemoryStorage.get(key)
	}

	set(key: string, value: T): void {
		this._inMemoryStorage.set(key, value)
	}

	delete(key: string): boolean {
		return this._inMemoryStorage.delete(key)
	}

	clear(): void {
		this._inMemoryStorage.clear()
	}
}
