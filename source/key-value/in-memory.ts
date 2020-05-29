import {ExtendedStore} from './type'

export class KeyValueInMemory<T> implements ExtendedStore<T> {
	readonly ttlSupport = false

	private readonly _inMemoryStorage: Map<string, T> = new Map()

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
