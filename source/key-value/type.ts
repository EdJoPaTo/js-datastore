import {MaybePromise} from '../types'

export interface KeyValueStorage<T> {
	readonly delete: (key: string) => MaybePromise<void>;
	readonly entries: () => MaybePromise<Record<string, T | undefined>>;
	readonly get: (key: string) => MaybePromise<T | undefined>;
	readonly keys: () => MaybePromise<readonly string[]>;
	readonly set: (key: string, value: T) => MaybePromise<void>;
}
