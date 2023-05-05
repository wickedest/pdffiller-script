// const fs = require('fs');
import fs from 'fs';
import path from 'path';
import { expect } from 'chai';
import simple from 'simple-mock';
import pdfFiller from 'pdffiller';
import { map, Form } from '../src/index.js';

const examplePdf = path.join('example', 'f1040.pdf');
const mapFile = path.join('example', 'f1040-map.yaml');
const fillerFile = path.join('example', 'f1040-script.yaml');
const configFile = path.join('example', 'config.yaml');
const outputPdf = path.join('example', 'example.pdf');

describe('example', () => {
	beforeEach(() => {
		simple.mock(pdfFiller, 'fillFormWithFlattenAsync')
			.resolveWith();
	});

	afterEach(() => {
		simple.restore();
	});

	it('should generate a map YAML file for the example PDF file', async () => {
		// simple.mock(child_process, 'execFile').throwWith(new Error('omg'));
		simple.mock(pdfFiller, 'generatePDFTemplateAsync').resolveWith({
			key1: 'banana'
		});
		simple.mock(fs.promises, 'writeFile').resolveWith();

		await map(examplePdf, { dir: 'example' });
		expect(fs.existsSync(mapFile)).to.be.true;

		expect(fs.promises.writeFile.calls).to.have.length(1);
		expect(fs.promises.writeFile.calls[0].args[0])
			.to.equal('example/f1040-map.yaml');
		expect(fs.promises.writeFile.calls[0].args[1])
			.to.equal('key1: \'0\'\n');
		expect(pdfFiller.generatePDFTemplateAsync.calls).to.have.length(1);
		expect(pdfFiller.generatePDFTemplateAsync.calls[0].args[0])
			.to.equal('example/f1040.pdf');
	});

	it('should fill the example PDF form', async () => {
		simple.mock(pdfFiller, 'fillFormWithFlattenAsync').resolveWith();

		const expected = {
			'filing.status': '1',
			'your.first.name.and.middle.initial': 'Joe A',
			'topmostSubform[0].Page1[0].f1_02[0]': 'Joe A',
			'topmostSubform[0].Page1[0].FilingStatus[0].c1_01[0]': '1',
			'last.name': 'Bloggs',
			'topmostSubform[0].Page1[0].f1_03[0]': 'Bloggs',
			'social.security.number': '012345678',
			'topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_04[0]': '012345678'
		};

		const form = new Form();
		await form.init(configFile);
		await form.load(examplePdf, mapFile);
		await form.fill(fillerFile);
		await form.save(outputPdf);

		expect(pdfFiller.fillFormWithFlattenAsync.calls)
			.to.have.length(1);
		expect(pdfFiller.fillFormWithFlattenAsync.lastCall.args)
			.to.deep.equal([ examplePdf, outputPdf, expected, false ]);
	});
});
