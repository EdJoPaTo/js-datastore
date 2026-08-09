import stringify from 'json-stable-stringify';
import writeFileAtomic from 'write-file-atomic';

export async function writeJsonFile(
	filename: string,
	data: unknown,
): Promise<void> {
	const content = stringify(data, {space: '\t'});
	if (!content) {
		throw new Error('cant stringify data to valid JSON: ' + typeof data);
	}

	await writeFileAtomic(filename, content + '\n', 'utf8');
}
