import {MaybePromise} from './types'
import {KeyValueInMemory} from './key-value'

import {arrayToRecord} from './transform'

export type QueryOneFunction<T> = (key: string) => MaybePromise<T>
export type QueryBulkFunction<T> = (keys: readonly string[]) => MaybePromise<Record<string, T>>

interface QueryOneArgument<T> {
	singleQuery: QueryOneFunction<T>;
	bulkQuery?: QueryBulkFunction<T>;
}

interface QueryBulkArgument<T> {
	singleQuery?: QueryOneFunction<T>;
	bulkQuery: QueryBulkFunction<T>;
}

type QueryArgument<T> = QueryOneArgument<T> | QueryBulkArgument<T>

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

	private readonly _singleQuery: QueryOneFunction<T>

	private readonly _bulkQuery: QueryBulkFunction<T>

	constructor(
		readonly query: QueryArgument<T>,
		options: Options<T> = {}
	) {
		this._store = options.store ?? new KeyValueInMemory()
		this._ttl = options.ttl

		this._singleQuery = query.singleQuery ?? (async key => {
			const result = await query.bulkQuery!([key])
			return result[key]
		})

		this._bulkQuery = query.bulkQuery ?? (async (keys): Promise<Record<string, T>> => {
			const entries = await Promise.all(keys
				.map(async (key): Promise<{readonly key: string; readonly value: T}> => {
					const value = await query.singleQuery!(key)
					return {key, value}
				})
			)

			const result: Record<string, T> = {}
			for (const {key, value} of entries) {
				result[key] = value
			}

			return result
		})
	}

	async get(key: string, forceQuery = false): Promise<T> {
		if (!forceQuery) {
			const value = await this._store.get(key)
			if (value) {
				return value
			}
		}

		const queried = await this._singleQuery(key)
		await this._store.set(key, queried, this._ttl)
		return queried
	}

	async getMany(keys: readonly string[], force = false): Promise<Record<string, T>> {
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

		if (keysToBeLoaded.length > 0) {
			const queryResults = await this._bulkQuery(keysToBeLoaded)
			await Promise.all(Object.keys(queryResults)
				.map(async key => this._store.set(key, queryResults[key], this._ttl))
			)
		}

		const resultEntries = await Promise.all(keys
			.map(async (key): Promise<{readonly key: string; readonly value: T}> => {
				const value = await this._store.get(key)
				return {key, value: value!}
			})
		)

		return arrayToRecord(resultEntries)
	}
}
