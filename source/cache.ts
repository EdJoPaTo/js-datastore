import {MaybePromise} from './types'
import {KeyValueInMemory} from './key-value'

interface Store<T> {
	readonly get: (key: string) => MaybePromise<T | undefined>;
	readonly set: (key: string, value: T, ttl?: number) => MaybePromise<unknown>;
}

export interface Options<T> {
	readonly store?: Store<T>;
	readonly ttl?: number;
}

export class Cache<T> {
	private readonly _store: Store<T>

	private readonly _ttl: number | undefined

	constructor(
		readonly query: (key: string) => MaybePromise<T>,
		options: Options<T> = {}
	) {
		this._store = options.store ?? new KeyValueInMemory()
		this._ttl = options.ttl
	}

	async size(): Promise<number> {
		const keys = await this._store.keys()
		return keys.length
	}

	async get(key: string, forceQuery = false): Promise<T> {
		if (!forceQuery) {
			const value = await this._store.get(key)
			if (value) {
				return value
			}
		}

		const queried = await this.query(key)
		await this._store.set(key, queried, this._ttl)
		return queried
	}
}

/**
 * Query can load multiple keys at once speeding up loading processes
 */
export class BulkCache<T> {
	private readonly _store: Store<T>

	private readonly _ttl: number | undefined

	constructor(
		readonly query: (key: readonly string[]) => MaybePromise<Record<string, T>>,
		options: Options<T> = {}
	) {
		this._store = options.store ?? new KeyValueInMemory()
		this._ttl = options.ttl
	}

	async get(key: string, forceQuery = false): Promise<T> {
		if (!forceQuery) {
			const value = await this._store.get(key)
			if (value) {
				return value
			}
		}

		const result = await this.query([key])
		const queried = result[key]
		await this._store.set(key, queried, this._ttl)
		return queried
	}

	async preload(keys: readonly string[], force = false): Promise<void> {
		let keysToBeLoaded: readonly string[]
		if (force) {
			keysToBeLoaded = keys
		} else {
			const missingKeys = await Promise.all(keys
				.map(async key => {
					const missing = (await this._store.get(key)) === undefined
					return missing ? key : undefined
				})
			)
			keysToBeLoaded = missingKeys
				.filter((o): o is string => typeof o === 'string')
		}

		const results = await this.query(keysToBeLoaded)
		await Promise.all(Object.keys(results)
			.map(async key => this._store.set(key, results[key], this._ttl))
		)
	}
}
