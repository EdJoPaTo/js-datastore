import type {MaybePromise} from '../types.js';

export type Entry<T> = {
	readonly value: T;
	/** Is undefined when endless (unspecified ttl) */
	readonly until: number | undefined;
};

export function createEntry<T>(
	value: T,
	ttl: number | undefined,
	now = Date.now(),
): Entry<T> {
	if (typeof ttl !== 'number') {
		return {value, until: Number.POSITIVE_INFINITY};
	}

	const until = now + ttl;
	return {value, until};
}

export async function cleanupOld<K extends string, V>(
	map: Readonly<ReadonlyMap<K, Entry<V>>>,
	deleteFunction: (key: K) => MaybePromise<boolean>,
	now = Date.now(),
): Promise<void> {
	const toBeDeleted: K[] = [];

	for (const [key, value] of map.entries()) {
		if (typeof value.until === 'number' && value.until < now) {
			toBeDeleted.push(key);
		}
	}

	await Promise.all(toBeDeleted.map(async o => deleteFunction(o)));
}
