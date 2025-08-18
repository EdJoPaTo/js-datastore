import type {MaybePromise} from '../types.ts';

export type RawObjectStorage<T> = {
	readonly delete: () => MaybePromise<void>;
	readonly get: () => MaybePromise<T | undefined>;
	readonly set: (value: T) => MaybePromise<void>;
};
