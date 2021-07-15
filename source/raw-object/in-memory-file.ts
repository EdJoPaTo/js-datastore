import {readFileSync, unlinkSync, existsSync} from 'fs'

import writeJsonFile from 'write-json-file'

import {RawObjectStorage} from './type'

export class RawObjectInMemoryFile<T> implements RawObjectStorage<T> {
	private _content: T | undefined

	constructor(
		private readonly _filepath: string,
	) {
		if (existsSync(this._filepath)) {
			const raw = readFileSync(this._filepath, 'utf8')
			const json = JSON.parse(raw) as T
			this._content = json
		}
	}

	get(): T | undefined {
		return this._content
	}

	async set(value: T): Promise<void> {
		this._content = value
		await writeJsonFile(this._filepath, value, {sortKeys: true})
	}

	delete(): void {
		this._content = undefined
		if (existsSync(this._filepath)) {
			unlinkSync(this._filepath)
		}
	}
}
