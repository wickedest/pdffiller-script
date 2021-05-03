const simple = require('simple-mock');
const { expect } = require('chai');
const pdfFiller = require('pdffiller');
const Form = require('../src/form');

describe('form', () => {
	beforeEach(() => {
		simple.mock(pdfFiller, 'fillFormWithFlattenAsync')
			.resolveWith();
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
		const config = {};
		const map = {
			'form[0].city.input[0]': '0'
		};
		const filler = {
			fill_city: {
				0: '"New York"'
			}
		};
		const expected = {
			'fill_city': 'New York',
			'form[0].city.input[0]': 'New York'
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(pdfFiller.fillFormWithFlattenAsync.calls)
			.to.have.length(1);
		expect(pdfFiller.fillFormWithFlattenAsync.lastCall.args)
			.to.deep.equal([ 'foo.pdf', 'dest.pdf', expected, false ]);
	});

	it('should fill a form using a direct field index', async () => {
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
		const expected = {
			'fill_city': 'Dublin',
			'form[0].city.input[0]': 'Dublin'
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(pdfFiller.fillFormWithFlattenAsync.calls)
			.to.have.length(1);
		expect(pdfFiller.fillFormWithFlattenAsync.lastCall.args)
			.to.deep.equal([ 'foo.pdf', 'dest.pdf', expected, false ]);
	});

	it('should fill a form using helper functions', async () => {
		const config = {
			city: 'd-u-b-l-i-n'
		};
		const map = {
			'form[0].city.input[0]': '0'
		};
		const filler = {
			fill_city: {
				0: 'strNoDash(strCapitalize(ctx.city))'
			}
		};
		const expected = {
			'fill_city': 'Dublin',
			'form[0].city.input[0]': 'Dublin'
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(pdfFiller.fillFormWithFlattenAsync.calls)
			.to.have.length(1);
		expect(pdfFiller.fillFormWithFlattenAsync.lastCall.args)
			.to.deep.equal([ 'foo.pdf', 'dest.pdf', expected, false ]);
	});

	it('should fill a form using built-in endsWith functions', async () => {
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
		const expected = {
			'fill_city.nodash': 'd-u-b-l-i-n',
			'form[0].city.input[0]': 'dublin'
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(pdfFiller.fillFormWithFlattenAsync.calls)
			.to.have.length(1);
		expect(pdfFiller.fillFormWithFlattenAsync.lastCall.args)
			.to.deep.equal([ 'foo.pdf', 'dest.pdf', expected, false ]);
	});

	it('should fill a form using registered endsWith functions', async () => {
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
		const expected = {
			'fill_city.upper': 'dublin',
			'form[0].city.input[0]': 'DUBLIN'
		};

		const form = new Form();
		form.registerFriendlyKeyHelpers({
			'.upper': (val) => val.toUpperCase()
		});
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(pdfFiller.fillFormWithFlattenAsync.calls)
			.to.have.length(1);
		expect(pdfFiller.fillFormWithFlattenAsync.lastCall.args)
			.to.deep.equal([ 'foo.pdf', 'dest.pdf', expected, false ]);
	});

	it('should fill a form using a calculation function', async () => {
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
		const expected = {
			'fill_city': 'Dublin, Ireland',
			'form[0].city.input[0]': 'Dublin, Ireland'
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(pdfFiller.fillFormWithFlattenAsync.calls)
			.to.have.length(1);
		expect(pdfFiller.fillFormWithFlattenAsync.lastCall.args)
			.to.deep.equal([ 'foo.pdf', 'dest.pdf', expected, false ]);
	});

	it('should fill a form using a calculation function with helper', async () => {
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
		const expected = {
			'fill_city': 'DUB',
			'form[0].city.input[0]': 'DUB'
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(pdfFiller.fillFormWithFlattenAsync.calls)
			.to.have.length(1);
		expect(pdfFiller.fillFormWithFlattenAsync.lastCall.args)
			.to.deep.equal([ 'foo.pdf', 'dest.pdf', expected, false ]);
	});

	it('should update form with empty values when config property is undefined', async () => {
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
		const expected = {
			'fill_city': '',
			'form[0].city.input[0]': ''
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(pdfFiller.fillFormWithFlattenAsync.calls)
			.to.have.length(1);
		expect(pdfFiller.fillFormWithFlattenAsync.lastCall.args)
			.to.deep.equal([ 'foo.pdf', 'dest.pdf', expected, false ]);
	});

	it('should update form with values obtained from nested config property', async () => {
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
		const expected = {
			'fill_city': 'Dublin',
			'form[0].city.input[0]': 'Dublin'
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(pdfFiller.fillFormWithFlattenAsync.calls)
			.to.have.length(1);
		expect(pdfFiller.fillFormWithFlattenAsync.lastCall.args)
			.to.deep.equal([ 'foo.pdf', 'dest.pdf', expected, false ]);
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
				.to.equal('failed to find field index \'5\' in field map');
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
				.to.equal('ENOENT: no such file or directory, access \'missing.yaml\'');
		}
	});

	it('should fail to load a config file that does not parse as YAML', async () => {
		const form = new Form();
		try {
			await form.init('README.md');
			expect.fail('Unexpected');
		} catch (ex) {
			expect(ex.message)
				.to.include('end of the stream or a document');
		}
	});

	it('should fill a form using .whole helper function, persisting the converted value in the form and not converting the unmodified value', async () => {
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
		const expected = {
			'fill_amount.whole': 1234,
			'form[0].amount.input[0]': '1,234'
		};

		const form = new Form();
		await form.init(config);
		await form.load('foo.pdf', map);
		await form.fill(filler);
		await form.save('dest.pdf');

		expect(pdfFiller.fillFormWithFlattenAsync.calls)
			.to.have.length(1);
		expect(pdfFiller.fillFormWithFlattenAsync.lastCall.args)
			.to.deep.equal([ 'foo.pdf', 'dest.pdf', expected, false ]);
	});
});
