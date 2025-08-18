import {existsSync, readFileSync, unlinkSync} from 'node:fs';
import {writeJsonFile} from '../write.ts';
import type {RawObjectStorage} from './type.ts';

export class RawObjectInMemoryFile<T> implements RawObjectStorage<T> {
	readonly #filepath: string;
	#content: T | undefined;

	constructor(filepath: string) {
		this.#filepath = filepath;
		if (existsSync(filepath)) {
			const raw = readFileSync(filepath, 'utf8');
			const json = JSON.parse(raw) as T;
			this.#content = json;
		}
	}

	get(): T | undefined {
		return this.#content;
	}

	async set(value: T): Promise<void> {
		this.#content = value;
		await writeJsonFile(this.#filepath, value);
	}

	delete(): void {
		this.#content = undefined;
		if (existsSync(this.#filepath)) {
			unlinkSync(this.#filepath);
		}
	}
}
