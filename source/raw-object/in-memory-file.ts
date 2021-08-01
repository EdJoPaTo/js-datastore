import {readFileSync, unlinkSync, existsSync} from 'fs'

import {writeJsonFile} from '../write.js'

import {RawObjectStorage} from './type'

export class RawObjectInMemoryFile<T> implements RawObjectStorage<T> {
	#content: T | undefined

	constructor(
		private readonly filepath: string,
	) {
		if (existsSync(this.filepath)) {
			const raw = readFileSync(this.filepath, 'utf8')
			const json = JSON.parse(raw) as T
			this.#content = json
		}
	}

	get(): T | undefined {
		return this.#content
	}

	async set(value: T): Promise<void> {
		this.#content = value
		await writeJsonFile(this.filepath, value)
	}

	delete(): void {
		this.#content = undefined
		if (existsSync(this.filepath)) {
			unlinkSync(this.filepath)
		}
	}
}
