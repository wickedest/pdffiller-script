import fs from 'fs/promises';
import path from 'path';
import { expect } from 'chai';
import simple from 'simple-mock';
import { PDFDocument } from '@cantoo/pdf-lib';
import { map, Form } from '../src/index.js';

const examplePdf = path.join('example', 'f1040.pdf');
const mapFile = path.join('example', 'f1040-map.yaml');
const fillerFile = path.join('example', 'f1040-script.yaml');
const configFile = path.join('example', 'config.yaml');
const outputPdf = path.join('example', 'example.pdf');

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

describe('example', () => {
	beforeEach(() => {
		simple.mock(fs, 'writeFile').resolveWith();
	});

	afterEach(() => {
		simple.restore();
	});

	it('should generate a map YAML file for the example PDF file', async () => {
		await mockForm('key1');
		simple.mock(fs, 'writeFile').resolveWith();

		await map(examplePdf, { dir: 'example' });

		// expect(fs.existsSync(mapFile)).to.be.true;
		expect(fs.writeFile.calls).to.have.length(1);
		expect(fs.writeFile.calls[0].args[0])
			.to.equal('example/f1040-map.yaml');
		expect(fs.writeFile.calls[0].args[1])
			.to.equal('key1: \'0\'\n');
	});

	it('should fill the example PDF form', async () => {
		const form = new Form();
		await form.init(configFile);
		await form.load(examplePdf, mapFile);
		await form.fill(fillerFile);
		await form.save(outputPdf);

		expect(fs.writeFile.calls).to.have.length(1);
		expect(fs.writeFile.calls[0].arg).to.equal('example/example.pdf');
		expect(form.ctx.forms.f1040).to.deep.equal({
			'filing.status': '1',
			'your.first.name.and.middle.initial': 'Joe A',
			'topmostSubform[0].Page1[0].f1_02[0]': 'Joe A',
			'topmostSubform[0].Page1[0].FilingStatus[0].c1_01[0]': '1',
			'last.name': 'Bloggs',
			'topmostSubform[0].Page1[0].f1_03[0]': 'Bloggs',
			'social.security.number': '012345678',
			'topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_04[0]': '012345678'
		});
	});
});
