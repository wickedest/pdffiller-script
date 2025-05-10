import fs from 'fs/promises';
import simple from 'simple-mock';
import { expect } from 'chai';
import { PDFDocument } from '@cantoo/pdf-lib';
import Form from '../src/form.js';

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

describe('form', () => {
	beforeEach(() => {
		simple.mock(fs, 'readFile').resolveWith('bytes');
		simple.mock(fs, 'writeFile').resolveWith();
	});

	afterEach(() => {
		simple.restore();
	});

	it('should not allow reserved fields when initializing form', async () => {
		const form = new Form();
		try {
			await form.init({ forms: 'bad' });
			expect.fail('Unexpected');
		} catch (ex) {
			expect(ex.message)
				.to.equal('You cannot use a reserved key: forms');
		}
	});

	it('should fill a form using a static value', async () => {
		const textField = await mockForm('form[0].city.input[0]');

		const config = {};
		const map = {
			'form[0].city.input[0]': '0'
		};
		const script = {
			fill_city: {
				0: '"New York"'
			}
		};

		const form = new Form();
		await form.init(config);
		await form.load('source.pdf', map);
		await form.fill(script);
		await form.save('dest.pdf');

		expect(PDFDocument.load.calls)
			.to.have.length(1);
		expect(PDFDocument.load.lastCall.args)
			.to.deep.equal([ 'bytes' ]);
		expect(textField.getText()).to.equal('New York');
		expect(fs.writeFile.lastCall.args[0]).to.equal('dest.pdf');
	});

	it('should fill a form using a direct field index', async () => {
		const textField = await mockForm('form[0].city.input[0]');

		const config = {
			city: 'Dublin'
		};
		const map = {
			'form[0].city.input[0]': '0'
		};
		const filler = {
			fill_city: {
				0: 'ctx.city'
			}
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(PDFDocument.load.calls)
			.to.have.length(1);
		expect(PDFDocument.load.lastCall.args)
			.to.deep.equal([ 'bytes' ]);
		expect(textField.getText()).to.equal('Dublin');
		expect(fs.writeFile.lastCall.args[0]).to.equal('dest.pdf');
	});

	it('should fill a form using helper functions', async () => {
		const textField = await mockForm('form[0].city.input[0]');
		const config = {
			city: ' d-u-b-l-i-n '
		};
		const map = {
			'form[0].city.input[0]': '0'
		};
		const filler = {
			fill_city: {
				0: 'strCapitalize(strTrim(strNoDash(ctx.city)))'
			}
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(PDFDocument.load.calls)
			.to.have.length(1);
		expect(PDFDocument.load.lastCall.args)
			.to.deep.equal([ 'bytes' ]);
		expect(textField.getText()).to.equal('Dublin');
		expect(fs.writeFile.lastCall.args[0]).to.equal('dest.pdf');
	});

	it('should fill a form using suffix functions', async () => {
		const textField = await mockForm('form[0].city.input[0]');
		const config = {
			city: 'd-u-b-l-i-n'
		};
		const map = {
			'form[0].city.input[0]': '0'
		};
		const filler = {
			'fill_city.nodash': {
				0: 'ctx.city'
			}
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(PDFDocument.load.calls)
			.to.have.length(1);
		expect(PDFDocument.load.lastCall.args)
			.to.deep.equal([ 'bytes' ]);
		expect(textField.getText()).to.equal('dublin');
		expect(fs.writeFile.lastCall.args[0]).to.equal('dest.pdf');
	});

	it('should fill a form using custom suffix functions', async () => {
		const textField = await mockForm('form[0].city.input[0]');
		const config = {
			city: 'dublin'
		};
		const map = {
			'form[0].city.input[0]': '0'
		};
		const filler = {
			'fill_city.upper': {
				0: 'ctx.city'
			}
		};

		const form = new Form();
		form.registerFriendlyKeyHelpers({
			'.upper': (val) => val.toUpperCase()
		});
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(PDFDocument.load.calls)
			.to.have.length(1);
		expect(PDFDocument.load.lastCall.args)
			.to.deep.equal([ 'bytes' ]);
		expect(textField.getText()).to.equal('DUBLIN');
		expect(fs.writeFile.lastCall.args[0]).to.equal('dest.pdf');
	});

	it('should fill a form using a calculation function', async () => {
		const textField = await mockForm('form[0].city.input[0]');
		const config = {
			city: 'Dublin'
		};
		const map = {
			'form[0].city.input[0]': '0'
		};
		const filler = {
			fill_city: {
				value: 'ctx.city',
				calculate: `(ctx, value) => {
					if (value === 'Dublin') {
						return {
							fill: 'Dublin, Ireland',
							field: '0'
						};
					}
				}`
			}
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(PDFDocument.load.calls)
			.to.have.length(1);
		expect(PDFDocument.load.lastCall.args)
			.to.deep.equal([ 'bytes' ]);
		expect(textField.getText()).to.equal('Dublin, Ireland');
		expect(fs.writeFile.lastCall.args[0]).to.equal('dest.pdf');
	});

	it('should fill a form using a calculation function with helper', async () => {
		const textField = await mockForm('form[0].city.input[0]');
		const config = {
			city: 'Dublin'
		};
		const map = {
			'form[0].city.input[0]': '0'
		};
		const filler = {
			fill_city: {
				value: 'ctx.city',
				calculate: `(ctx, value) => {
					if (value === 'Dublin') {
						return {
							fill: strTrim(' DUB '),
							field: '0'
						};
					}
				}`
			}
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(PDFDocument.load.calls)
			.to.have.length(1);
		expect(PDFDocument.load.lastCall.args)
			.to.deep.equal([ 'bytes' ]);
		expect(textField.getText()).to.equal('DUB');
		expect(fs.writeFile.lastCall.args[0]).to.equal('dest.pdf');
	});

	it('should update form with empty values when config property is undefined', async () => {
		const textField = await mockForm('form[0].city.input[0]');
		const config = {
			city: 'Dublin'
		};
		const map = {
			'form[0].city.input[0]': '0'
		};
		const filler = {
			fill_city: {
				0: 'ctx.unknown'
			}
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(PDFDocument.load.calls)
			.to.have.length(1);
		expect(PDFDocument.load.lastCall.args)
			.to.deep.equal([ 'bytes' ]);
		expect(textField.getText()).to.equal(undefined);
		expect(fs.writeFile.lastCall.args[0]).to.equal('dest.pdf');
	});

	it('should update form with values obtained from nested config property', async () => {
		const textField = await mockForm('form[0].city.input[0]');
		const config = {
			location: {
				city: 'Dublin'
			}
		};
		const map = {
			'form[0].city.input[0]': '0'
		};
		const filler = {
			fill_city: {
				0: 'ctx.location.city'
			}
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(PDFDocument.load.calls)
			.to.have.length(1);
		expect(PDFDocument.load.lastCall.args)
			.to.deep.equal([ 'bytes' ]);
		expect(textField.getText()).to.equal('Dublin');
		expect(fs.writeFile.lastCall.args[0]).to.equal('dest.pdf');
	});

	it('should fill a form using .whole helper function, persisting the converted value in the form and not converting the unmodified value', async () => {
		const textField = await mockForm('form[0].amount.input[0]');
		const config = {
			total: 1234
		};
		const map = {
			'form[0].amount.input[0]': '0'
		};
		const filler = {
			'fill_amount.whole': {
				0: 'ctx.total'
			}
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(PDFDocument.load.calls)
			.to.have.length(1);
		expect(PDFDocument.load.lastCall.args)
			.to.deep.equal([ 'bytes' ]);
		expect(textField.getText()).to.equal('1,234');
		expect(fs.writeFile.lastCall.args[0]).to.equal('dest.pdf');
	});

	it('should fail to fill a form using a calculation function that does not return {field, fill}', async () => {
		const config = {
			city: 'Dublin'
		};
		const map = {
			'form[0].city.input[0]': '0'
		};
		const filler = {
			fill_city: {
				value: 'ctx.city',
				calculate: `(ctx, value) => {
					return 'Invalid';
				}`
			}
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		try {
			await form.fill(filler);
			expect.fail('Unexpected');
		} catch (ex) {
			expect(ex.message)
				.to.equal('calculate functions should return an object: { field, fill }');
		}
	});

	it('should fail to update form when map is missing index', async () => {
		const config = {
			city: 'd-u-b-l-i-n'
		};
		const map = {
			'form[0].city.input[0]': '0'
		};
		const filler = {
			fill_city: {
				5: 'strNoDash(strCapitalize(ctx.city))'
			}
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		try {
			await form.fill(filler);
			expect.fail('Unexpected');
		} catch (ex) {
			expect(ex.message)
				.to.equal('failed to find field \'5\' in script foo.yaml > fill_city. It could mean that the foo-map.yaml file is out of sync with the filler script.');
		}
	});

	it('should fail to update form when filler has more than one key', async () => {
		const config = {
			city: 'd-u-b-l-i-n'
		};
		const map = {
			'form[0].city.input[0]': '0'
		};
		const filler = {
			fill_city: {
				0: 'strNoDash(strCapitalize(ctx.city))',
				1: 'Bad'
			}
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		try {
			await form.fill(filler);
			expect.fail('Unexpected');
		} catch (ex) {
			expect(ex.message)
				.to.equal('fill_city has more than 1 field to fill');
		}
	});

	it('should fail to update form indexed template fails to compile', async () => {
		const config = {
			city: 'Dublin'
		};
		const map = {
			'form[0].city.input[0]': '0'
		};
		const filler = {
			fill_city: {
				0: 'badFunc(ctx.city)'
			}
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		try {
			await form.fill(filler);
			expect.fail('Unexpected');
		} catch (ex) {
			expect(ex.message)
				.to.equal('badFunc is not defined');
		}
	});

	it('should fail to init YAML config file that does not exist', async () => {
		const form = new Form();
		try {
			await form.init('missing.yaml');
			expect.fail('Unexpected');
		} catch (ex) {
			expect(ex.message)
				.to.equal('Invalid config YAML "missing.yaml": Error: ENOENT: no such file or directory, access \'missing.yaml\'');
		}
	});

	it('should fail to load a config file that does not parse as YAML', async () => {
		simple.restore(fs, 'readFile');
		const form = new Form();
		try {
			await form.init('README.md');
			expect.fail('Unexpected');
		} catch (ex) {
			expect(ex.message)
				.to.include('end of the stream or a document');
		}
	});
});
