const os = require('os');
const fs = require('fs');
const path = require('path');
const simple = require('simple-mock');
const { expect } = require('chai');
const pdfFiller = require('pdffiller');
const { map } = require('../');

const { promises: afs } = fs;
const examplePdf = path.resolve(path.join('example', 'f1040.pdf'));

describe('map', () => {
	afterEach(() => {
		simple.restore();
	});

	it('should export a function', () => {
		expect(map).to.be.a('function');
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

	it('should generate only map', async () => {
		simple.mock(fs.promises, 'access').resolveWith();
		simple.mock(fs.promises, 'writeFile').resolveWith();
		simple.mock(pdfFiller, 'generatePDFTemplateAsync').resolveWith({
			key1: 'banana'
		});

		await map(examplePdf, { dir: 'banana' });

		expect(fs.promises.access.calls).to.have.length(1);
		expect(fs.promises.access.calls[0].arg).to.equal('banana');
		expect(fs.promises.writeFile.calls).to.have.length(1);
		expect(fs.promises.writeFile.calls[0].arg)
			.to.equal('banana/f1040-map.yaml');
	});

	it('should generate map and examples in local directory', async () => {
		simple.mock(fs.promises, 'access').resolveWith();
		simple.mock(fs.promises, 'writeFile').resolveWith();
		simple.mock(pdfFiller, 'generatePDFTemplateAsync').resolveWith({
			key1: 'banana'
		});
		simple.mock(pdfFiller, 'fillFormWithFlattenAsync').resolveWith();
		simple.mock(fs.promises, 'writeFile').resolveWith();

		await map(examplePdf, {
			name: 'foo',
			example: true
		});

		expect(pdfFiller.generatePDFTemplateAsync.calls).to.have.length(1);
		expect(pdfFiller.fillFormWithFlattenAsync.calls).to.have.length(1);

		expect(fs.promises.writeFile.calls).to.have.length(3);
		expect(fs.promises.writeFile.calls[0].args[0])
			.to.equal(`foo-map.yaml`);
		expect(fs.promises.writeFile.calls[1].args[0])
			.to.equal(`foo-example-script.yaml`);
		expect(fs.promises.writeFile.calls[2].args[0])
			.to.equal(`foo-example-config.yaml`);
	});
});
