import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { map } from '../src/index.js';

const { expect } = chai;
chai.use(chaiAsPromised);

const examplePdf = path.join('example', 'f1040.pdf');

describe('integration', async () => {
	it('should generate map and examples', async () => {
		const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'pdffiller-script'));
		try {
			await map(examplePdf, {
				name: 'foo',
				dir: tmp,
				example: true
			});

			const files = [
				'foo-map.yaml',
				'foo-example-script.yaml',
				'foo-example-config.yaml',
				'foo-example-filled.pdf'
			];
			for (const file of files) {
				expect(fs.access(path.join(tmp, file), fs.constants.R_OK))
					.to.be.fulfilled;
			}
		} finally {
			await fs.rmdir(tmp, { recursive: true });
		}
	});
});
