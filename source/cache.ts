import {KeyValueInMemory} from './key-value/index.ts';
import type {MaybePromise} from './types.ts';

export type Query<K extends string, V> = (
	keys: readonly K[],
) => MaybePromise<Record<K, V>>;

type Store<K extends string, V> = {
	readonly get: (key: K) => MaybePromise<V | undefined>;
	readonly set: (key: K, value: V, ttl?: number) => MaybePromise<unknown>;
};

export type Options<K extends string, V> = {
	readonly query: Query<K, V>;
	readonly store?: Store<K, V>;
	readonly ttl?: number;
};

export function cacheBulkQueryFromSingle<K extends string, V>(singleQuery: (key: K) => MaybePromise<V>): Query<K, V> {
	return async keys => {
		const entries = await Promise.all(keys.map(async (key): Promise<[K, V]> => [key, await singleQuery(key)]));
		return Object.fromEntries(entries) as Record<K, V>;
	};
}

export class Cache<K extends string, V> {
	readonly #store: Store<K, V>;

	readonly #ttl: number | undefined;

	readonly #query: Query<K, V>;

	constructor(options: Options<K, V>) {
		this.#query = options.query;
		this.#store = options.store ?? new KeyValueInMemory();
		this.#ttl = options.ttl;
	}

	async get(key: K, forceQuery = false): Promise<V> {
		if (!forceQuery) {
			const value = await this.#store.get(key);
			if (value) {
				return value;
			}
		}

		const queriedRecord = await this.#query([key]);
		const queried = queriedRecord[key];
		await this.#store.set(key, queried, this.#ttl);
		return queried;
	}

	async getMany(keys: readonly K[], force = false): Promise<Record<K, V>> {
		let keysToBeLoaded: readonly K[];
		if (force) {
			keysToBeLoaded = keys;
		} else {
			const missingKeys = await Promise.all(keys.map(async (key): Promise<string | undefined> => {
				const isMissing = (await this.#store.get(key)) === undefined;
				return isMissing ? key : undefined;
			}));
			keysToBeLoaded = missingKeys.filter((o): o is K => typeof o === 'string');
		}

		if (keysToBeLoaded.length > 0) {
			const queryResults = await this.#query(keysToBeLoaded);
			await Promise.all(Object.entries<V>(queryResults).map(async ([key, value]) =>
				this.#store.set(key as K, value, this.#ttl)));
		}

		const resultEntries = await Promise.all(keys.map(async (key): Promise<[K, V]> => {
			const value = await this.#store.get(key);
			return [key, value!];
		}));

		return Object.fromEntries(resultEntries) as Record<K, V>;
	}
}
