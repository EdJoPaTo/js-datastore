export function mapToRecord<T>(
	entries: Readonly<ReadonlyMap<string, T>>,
): Record<string, T> {
	const result: Record<string, T> = {};
	for (const [key, value] of entries.entries()) {
		result[key] = value;
	}

	return result;
}

export function arrayToRecord<T>(
	entries: ReadonlyArray<{readonly key: string; readonly value: T}>,
): Record<string, T> {
	const result: Record<string, T> = {};
	for (const {key, value} of entries) {
		result[key] = value;
	}

	return result;
}
