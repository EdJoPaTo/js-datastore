import {KeyValueInMemory} from './key-value/index.js';
import type {MaybePromise} from './types.js';

export type QueryOneFunction<K extends string, V> = (key: K) => MaybePromise<V>;
export type QueryBulkFunction<K extends string, V> = (
	keys: readonly K[],
) => MaybePromise<Record<K, V>>;

type QueryOneArgument<K extends string, V> = {
	readonly singleQuery: QueryOneFunction<K, V>;
	readonly bulkQuery?: QueryBulkFunction<K, V>;
};

type QueryBulkArgument<K extends string, V> = {
	readonly singleQuery?: QueryOneFunction<K, V>;
	readonly bulkQuery: QueryBulkFunction<K, V>;
};

type QueryArgument<K extends string, V> =
	| QueryOneArgument<K, V>
	| QueryBulkArgument<K, V>;

type Store<K extends string, V> = {
	readonly get: (key: K) => MaybePromise<V | undefined>;
	readonly set: (key: K, value: V, ttl?: number) => MaybePromise<unknown>;
};

export type Options<K extends string, V> = {
	readonly store?: Store<K, V>;
	readonly ttl?: number;
};

function generateFallbackBulk<K extends string, V>(
	singleQuery: QueryOneFunction<K, V>,
): QueryBulkFunction<K, V> {
	return async keys => {
		const entries = await Promise.all(
			keys.map(async (key): Promise<[K, V]> => [key, await singleQuery(key)]),
		);
		return Object.fromEntries(entries) as Record<K, V>;
	};
}

export class Cache<K extends string, V> {
	readonly #store: Store<K, V>;

	readonly #ttl: number | undefined;

	readonly #singleQuery: QueryOneFunction<K, V>;

	readonly #bulkQuery: QueryBulkFunction<K, V>;

	constructor(
		readonly query: QueryArgument<K, V>,
		options: Options<K, V> = {},
	) {
		this.#store = options.store ?? new KeyValueInMemory();
		this.#ttl = options.ttl;

		this.#singleQuery = query.singleQuery ?? (async key => {
			const result = await query.bulkQuery!([key]);
			return result[key]!;
		});

		this.#bulkQuery = query.bulkQuery ?? generateFallbackBulk(query.singleQuery!);
	}

	async get(key: K, forceQuery = false): Promise<V> {
		if (!forceQuery) {
			const value = await this.#store.get(key);
			if (value) {
				return value;
			}
		}

		const queried = await this.#singleQuery(key);
		await this.#store.set(key, queried, this.#ttl);
		return queried;
	}

	async getMany(
		keys: readonly K[],
		force = false,
	): Promise<Record<K, V>> {
		let keysToBeLoaded: readonly K[];
		if (force) {
			keysToBeLoaded = keys;
		} else {
			const missingKeys = await Promise.all(keys
				.map(async (key): Promise<string | undefined> => {
					const missing = (await this.#store.get(key)) === undefined;
					return missing ? key : undefined;
				}));
			keysToBeLoaded = missingKeys
				.filter((o): o is K => typeof o === 'string');
		}

		if (keysToBeLoaded.length > 0) {
			const queryResults = await this.#bulkQuery(keysToBeLoaded);
			await Promise.all((Object.entries<V>(queryResults))
				// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
				.map(async ([key, value]) => this.#store.set(key as K, value, this.#ttl)),
			);
		}

		const resultEntries = await Promise.all(keys.map(
			async (key): Promise<[K, V]> => {
				const value = await this.#store.get(key);
				return [key, value!];
			},
		));

		return Object.fromEntries(resultEntries) as Record<K, V>;
	}
}
