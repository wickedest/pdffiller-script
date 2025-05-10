import fs from 'fs/promises';
import path from 'path';
import simple from 'simple-mock';
import { expect } from 'chai';
import { PDFDocument } from '@cantoo/pdf-lib';
import { map } from '../src/index.js';

const examplePdf = path.resolve(path.join('example', 'f1040.pdf'));

async function mockForm(fieldName) {
	const doc = await PDFDocument.create();
	doc.addPage([550, 750]);
	const form = doc.getForm();
	const textField = form.createTextField(fieldName);
	simple.mock(PDFDocument, 'load').resolveWith(doc);
	simple.mock(fs, 'readFile').resolveWith('bytes');
	simple.mock(fs, 'writeFile').resolveWith();
	return textField;
}

describe('map', () => {
	afterEach(() => {
		simple.restore();
	});

	it('should export a function', () => {
		expect(map).to.be.a('function');
	});

	it('should fail if the output directory cannot be created', async () => {
		simple.mock(fs, 'mkdir').rejectWith(new Error('omg - errors!'));

		try {
			await map('example.pdf', {
				dir: 'foo'
			});
		} catch (ex) {
			expect(ex.message).to.equal('omg - errors!');
		}
	});

	it('should generate only map', async () => {
		mockForm('key1');
		simple.mock(fs, 'access').resolveWith();
		simple.mock(fs, 'writeFile').resolveWith();

		await map(examplePdf, { dir: 'banana' });

		expect(fs.access.calls).to.have.length(1);
		expect(fs.access.calls[0].arg).to.equal('banana');
		expect(fs.writeFile.calls).to.have.length(1);
		expect(fs.writeFile.calls[0].arg)
			.to.equal('banana/f1040-map.yaml');
	});

	it('should generate map and examples in local directory', async () => {
		mockForm('key1');
		simple.mock(fs, 'access').resolveWith();
		simple.mock(fs, 'writeFile').resolveWith();

		await map(examplePdf, {
			name: 'foo',
			example: true
		});

		expect(fs.writeFile.calls).to.have.length(3);
		expect(fs.writeFile.calls[0].args[0])
			.to.equal('foo-map.yaml');
		expect(fs.writeFile.calls[1].args[0])
			.to.equal('foo-example-script.yaml');
		expect(fs.writeFile.calls[2].args[0])
			.to.equal('foo-example-config.yaml');
	});
});
