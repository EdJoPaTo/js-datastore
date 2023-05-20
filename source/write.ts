import stringify from 'json-stable-stringify';
import writeFileAtomic from 'write-file-atomic';

export async function writeJsonFile(filename: string, data: unknown) {
	const content = stringify(data, {space: '\t'}) + '\n';
	await writeFileAtomic(filename, content, 'utf8');
}
