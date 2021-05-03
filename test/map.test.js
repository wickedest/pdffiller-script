const os = require('os');
const fs = require('fs');
const path = require('path');
const simple = require('simple-mock');
const { expect } = require('chai');
const pdfFiller = require('pdffiller');
const { map } = require('../');

const { promises: afs } = fs;
const examplePdf = path.join('example', 'f1040.pdf');

describe('map', () => {
	before(() => {
		simple.restore();
	});

	afterEach(() => {
		simple.restore();
	});

	it('should export a function', () => {
		expect(map).to.be.a('function');
	});

	it('should generate only map', async () => {
		simple.mock(pdfFiller, 'generatePDFTemplateAsync').resolveWith({
			key1: 'banana'
		});
		const tmp = await afs.mkdtemp(path.join(os.tmpdir(), 'pdffiller-engine-'));
		const cwd = process.cwd();

		try {
			const file = path.resolve(examplePdf);
			process.chdir(tmp);

			await afs.copyFile(file, path.join(tmp, 'example.pdf'));
			await map(path.join(tmp, 'example.pdf'));

			expect(fs.existsSync(path.join(tmp, 'example-map.yaml')))
				.to.be.true;
			expect(fs.existsSync(path.join(tmp, 'example-script.yaml')))
				.to.be.false;
			expect(fs.existsSync(path.join(tmp, 'example-config.yaml')))
				.to.be.false;
			expect(fs.existsSync(path.join(tmp, 'example-filled.pdf')))
				.to.be.false;
		} finally {
			process.chdir(cwd);
			await afs.rmdir(tmp, { recursive: true });
		}
	});

	it('should generate map and examples', async () => {
		simple.mock(pdfFiller, 'generatePDFTemplateAsync').resolveWith({
			key1: 'banana'
		});
		simple.mock(pdfFiller, 'fillFormWithFlattenAsync')
			.resolveWith();
		simple.mock(fs.promises, 'writeFile').resolveWith();

		const tmp = await afs.mkdtemp(path.join(os.tmpdir(), 'pdffiller-engine-'));
		try {
			await map(examplePdf, {
				name: 'foo',
				dir: tmp,
				example: true
			});

			expect(pdfFiller.generatePDFTemplateAsync.calls).to.have.length(1);
			expect(pdfFiller.fillFormWithFlattenAsync.calls).to.have.length(1);

			expect(fs.promises.writeFile.calls).to.have.length(3);
			expect(fs.promises.writeFile.calls[0].args[0])
				.to.equal(`${tmp}/foo-map.yaml`);
			expect(fs.promises.writeFile.calls[1].args[0])
				.to.equal(`${tmp}/foo-example-script.yaml`);
			expect(fs.promises.writeFile.calls[2].args[0])
				.to.equal(`${tmp}/foo-example-config.yaml`);

		} finally {
			await afs.rmdir(tmp, { recursive: true });
		}
	});

	it('should fail if the output directory cannot be created', async () => {
		simple.mock(afs, 'mkdir').throwWith(new Error('omg - errors!'));

		try {
			await map('example.pdf', {
				dir: 'foo'
			});
		} catch (ex) {
			expect(ex.message).to.equal('omg - errors!');
		}
	});
});
