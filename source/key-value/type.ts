import type {MaybePromise} from '../types.js';

// Do not export this.
// Either the user wants to use a specific implementation or define the minimal required Store themselves.
// For example the ExtendedStore does not allow for a Map to be assigned to to the different keys implementation.

// Internally this should still be used for ensuring typesafety.

// See Keyv current Store<T> typing: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/keyv/index.d.ts#L62
// make sure to accept unknown as a set return type as JS Map returns this for example which differs from other implementations

/**
 * Keyv compatible Store. See https://github.com/lukechilds/keyv
 */
export type Store<T> = {
	readonly ttlSupport: boolean;

	/**
	 * Get the current value of a key. Is undefined when the value is currently not set.
	 */
	readonly get: (key: string) => MaybePromise<T | undefined>;

	/**
	 * Set a key to a specific value.
	 * @param key key to be set
	 * @param value value to set to the key
	 * @param ttl time to live of the object in milliseconds from now (when supported by the implementation)
	 */
	readonly set: (key: string, value: T, ttl?: number) => MaybePromise<void>;

	/**
	 * Delete a key from the store. Returns true when the key existed, false if the element does not exist.
	 */
	readonly delete: (key: string) => MaybePromise<boolean>;

	/**
	 * Remove all entries
	 */
	readonly clear: () => MaybePromise<void>;
};

export type ExtendedStore<T> = Store<T> & {
	/**
	 * Return all currently set keys
	 */
	readonly keys: () => MaybePromise<readonly string[]>;
};
