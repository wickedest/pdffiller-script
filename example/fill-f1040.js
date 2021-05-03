#!/usr/bin/env node

const { Form } = require('..');

async function example1() {
	const form = new Form();
	await form.init('config.yaml');
	await form.load('f1040.pdf', 'f1040-map.yaml');
	await form.fill('f1040-filler.yaml');
	await form.save('f01040-filled-1.pdf');
}

async function example2() {
	const form = new Form();
	await form.init({
		identity: {
			firstName: 'Joe',
			lastName: 'Bloggs',
			middleName: 'Adam',
			ssn: '012-34-5678'
		},
		filingStatus: 'single'
	});
	await form.load('f1040.pdf', 'f1040-map.yaml');
	await form.fill({
		// The "filing.status" is just a friendly name for the value.  It helps
		// the script developer identify which field is being filled.  The
		// context (ctx) is updated by storing the property "filing.status" and
		// the value calculated here.  In other words, it updates the "filled"
		// field.
		'filing.status': {
			// The "ctx.filingStatus" is a config value (or a computed value)
			// used as the `value` input into the `calculate` function below.
			value: 'ctx.filingStatus',
			calculate: (ctx, value) => {
				// Sometimes, it is necessary to do some calculation with the
				// config `value`.  In this case, the word "single" is not a
				// valid value for the field (see "f1040-map.yaml"):
				// `topmostSubform[0].Page1[0].FilingStatus[0].c1_01[1]`
				// It must be converted to a valid value, which is an integer
				// number.  The actual filled value can be trial-and-error.
				switch (value) {
					case 'single':
						return { field: '0', fill: '1' }
					case 'married filing jointly':
						return { field: '1', fill: '2' }
					case 'married filing separately':
						return { field: '2', fill: '3' }
					case 'head of household':
						return { field: '3', fill: '4' }
					case 'qualifying widow(er)':
						return { field: '4', fill: '5' }
					default:
						throw new Error(`unknown filingStatus: ${value}`);
				}
			}
		},
		// This field joins a couple of inputs to product a first name and
		// middle initial.
		'your.first.name.and.middle.initial': {
			6: 'ctx.identity.firstName + (ctx.identity.middleName ? ` ${ctx.identity.middleName[0]}` : "")'
		},
		// Example of a simple map.
		'last.name': {
			7: 'ctx.identity.lastName'
		},
		// Example of using a helper function to strip dashes out of a string.
		'social.security.number': {
			8: 'strNoDash(ctx.identity.ssn)'
		}
	});
	await form.save('f01040-filled-2.pdf');
}

example1().catch(console.error);

example2().catch(console.error);
