import {MaybePromise} from '../types'

export interface RawObjectStorage<T> {
	delete(): MaybePromise<void>;
	get(): MaybePromise<T | undefined>;
	set(value: T): MaybePromise<void>;
}
