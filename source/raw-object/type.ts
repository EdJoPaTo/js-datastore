import {MaybePromise} from '../types'

export interface RawObjectStorage<T> {
	readonly delete: () => MaybePromise<void>;
	readonly get: () => MaybePromise<T | undefined>;
	readonly set: (value: T) => MaybePromise<void>;
}
