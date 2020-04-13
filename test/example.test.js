const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const simple = require('simple-mock');
const pdfFiller = require('pdffiller');
const { map, Form } = require('../');

const examplePdf = path.join('example', 'f1040.pdf');
const mapFile = path.join('example', 'f1040-map.yaml');
const fillerFile = path.join('example', 'f1040-filler.yaml');
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
		await map(examplePdf, { dir: 'example' });
		expect(fs.existsSync(mapFile)).to.be.true;
	});

	it('should fill the example PDF form', async () => {
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
