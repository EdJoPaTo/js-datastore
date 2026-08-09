import test from 'node:test';
import {deepEqual} from 'node:assert/strict';
import {Cache, cacheQueryFromSingle} from './cache.ts';

await test('works', async () => {
	const cache = new Cache<string, string>({
		query: cacheQueryFromSingle(key => String(Number(key.slice(1)) * 2)),
	});

	deepEqual(await cache.get('n2'), '4');
	deepEqual(await cache.get('n2'), '4');

	const manyFirst = await cache.getMany(['n3', 'n4']);
	deepEqual(manyFirst, {
		n3: '6',
		n4: '8',
	});

	const manySecond = await cache.getMany(['n2', 'n3', 'n4']);
	deepEqual(manySecond, {
		n2: '4',
		n3: '6',
		n4: '8',
	});
});
