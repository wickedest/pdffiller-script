import os from 'os';
import fs from 'fs';
import path from 'path';
import { expect } from 'chai';
import { sync as commandExists } from 'command-exists';
import { map } from '../src/index.js';

const { promises: afs } = fs;
const examplePdf = path.join('example', 'f1040.pdf');

describe('integration', async () => {
	const exists = commandExists('pdftk');

	(exists ? it : it.skip)('should generate map and examples using pdftk', async () => {
		const tmp = await afs.mkdtemp(path.join(os.tmpdir(), 'pdffiller-engine-'));
		try {
			await map(examplePdf, {
				name: 'foo',
				dir: tmp,
				example: true
			});

			expect(fs.existsSync(path.join(tmp, 'foo-map.yaml')))
				.to.be.true;
			expect(fs.existsSync(path.join(tmp, 'foo-example-script.yaml')))
				.to.be.true;
			expect(fs.existsSync(path.join(tmp, 'foo-example-config.yaml')))
				.to.be.true;
			expect(fs.existsSync(path.join(tmp, 'foo-example-filled.pdf')))
				.to.be.true;
		} finally {
			await afs.rmdir(tmp, { recursive: true });
		}
	});
});
