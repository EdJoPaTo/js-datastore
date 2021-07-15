import {mkdirSync, readdirSync, readFileSync, unlinkSync, existsSync} from 'fs'

import writeJsonFile from 'write-json-file'

import {ExtendedStore} from './type'

export class KeyValueInMemoryFiles<T> implements ExtendedStore<T> {
	get ttlSupport() {
		return false
	}

	readonly #inMemoryStorage = new Map<string, T>()

	constructor(
		private readonly directory: string,
	) {
		mkdirSync(directory, {recursive: true})

		const entries = this.#listFromFS()
		for (const entry of entries) {
			this.#inMemoryStorage.set(entry, this.#getFromFS(entry))
		}
	}

	keys(): readonly string[] {
		return [...this.#inMemoryStorage.keys()]
	}

	get(key: string): T | undefined {
		return this.#inMemoryStorage.get(key)
	}

	async set(key: string, value: T): Promise<void> {
		this.#inMemoryStorage.set(key, value)
		await writeJsonFile(this.#pathOfKey(key), value, {sortKeys: true})
	}

	delete(key: string): boolean {
		const result = this.#inMemoryStorage.delete(key)
		if (existsSync(this.#pathOfKey(key))) {
			unlinkSync(this.#pathOfKey(key))
		}

		return result
	}

	clear(): void {
		for (const key of this.keys()) {
			this.delete(key)
		}
	}

	#pathOfKey(key: string): string {
		return `${this.directory}/${key}.json`
	}

	#listFromFS(): readonly string[] {
		return readdirSync(this.directory)
			.map(o => o.replace('.json', ''))
	}

	#getFromFS(key: string): T {
		const content = readFileSync(this.#pathOfKey(key), 'utf8')
		const json = JSON.parse(content) as T
		return json
	}
}
