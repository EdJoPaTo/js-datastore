import {KeyValueStorage} from './type'

export class KeyValueInMemory<T> implements KeyValueStorage<T> {
	private _inMemoryStorage: Record<string, T | undefined> = {}

	entries(): Record<string, T | undefined> {
		return this._inMemoryStorage
	}

	keys(): readonly string[] {
		return Object.keys(this._inMemoryStorage)
	}

	get(key: string): T | undefined {
		return this._inMemoryStorage[key]
	}

	set(key: string, value: T): void {
		this._inMemoryStorage[key] = value
	}

	delete(key: string): void {
		delete this._inMemoryStorage[key]
	}
}
