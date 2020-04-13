const fs = require('fs');
const path = require('path');
const util = require('util');
const chalk = require('chalk');
const pdfFiller = require('pdffiller');
const YAML = require('js-yaml');
const getHelpers = require('./helpers');

const { promises: afs } = fs;
const log = require('debug')('pdffiller-script');
pdfFiller.fillFormWithFlattenAsync = util.promisify(pdfFiller.fillFormWithFlatten);

/**
 * Creates a fillable form from a PDF.
 */
class Form {
	async init(config) {
		ensureNotUsingReservedKeys(config);
		this.config = await loadYAML(config);
		this.ctx = {
			...this.config,
			forms: {}
		};
		this.helpers = getHelpers();
		this.helperNames = this.helpers.map(a => a.name);
		this.registerFriendlyKeyHelpers({
			'.currency': this.helpers[0], // currency
			'.dec': this.helpers[1], // currencyDec
			'.whole': this.helpers[2], // currencyWhole
			'.nodash': this.helpers[5] // strNoDash
		});
	}

	/**
	 * Initialize the form.  The `map` and `config` can be a string or an
	 * object.  If it is a string, then it will be read in as a YAML file.
	 * The `map` was previously generated from a PDF document using the
	 * {@link map} function.
	 *
	 * @param {string} source - The PDF source.
	 * @param {string|object} map - The map generated from {@link map}.
	 * @param {string|object} config - The config used by the filler script.
	 * @public
	 * @async
	 */
	async load(source, map) {
		// TODO: check `source` exists
		this.formName = path.basename(source, '.pdf');
		this.sourcePdf = source;
		this.map = await loadYAML(map);
		this.ctx.forms[this.formName] = {};
		// this.helpers = getHelpers();
		// this.helperNames = this.helpers.map(a => a.name);
		// this.ctx = {
		// 	...this.config,
		// 	forms: {
		// 		[this.formName]: {}
		// 	}
		// };
		// this.registerFriendlyKeyHelpers({
		// 	'.currency': this.helpers[0], // currency
		// 	'.dec': this.helpers[1], // currencyDec
		// 	'.whole': this.helpers[2], // currencyWhole
		// 	'.nodash': this.helpers[5] // strNoDash
		// });
	}

	/**
	 * HelperFunction definition
	 * @typedef {HelperFunction} HelperFunction
	 * @param {number|string} val
	 * @returns {number|string} The converted `val`.
	 */
	/**
	 * Registers friendly key helpers for use with the script.
	 * @param {object} funcs - A map of function suffix to {@link HelperFunction}.
	 */
	registerFriendlyKeyHelpers(funcs) {
		if (!this.endsWithFuncs) {
			this.endsWithFuncs = funcs;
			return;
		}
		this.endsWithFuncs = {
			...this.endsWithFuncs,
			...funcs
		};
	}

	/**
	 * Fills a form.  The `filler` can be a string or an object.  If it is a
	 * string, then it will be read in as a YAML file.
	 *
	 * @param {string|object} filler - The form filler script.
	 * @public
	 * @async
	 */
	async fill(filler) {
		filler = await loadYAML(filler);
		for (const friendlyKey in filler) {
			let fieldId;
			let fieldIndex;
			let fillValue;
			log('field: ', chalk.blue(friendlyKey));

			if (filler[friendlyKey].value) {
				log('  type: calculate');
				// this is a calculation. first, compute the value
				const value = this.evalTemplate(
					this.ctx, filler[friendlyKey].value);
				log('  calculate value:', value);

				// run through calculate function
				const { field, fill } = this.evalCalculate(
					this.ctx, filler[friendlyKey].calculate, value);

				log('  calculated:', { field, fill });

				fieldIndex = field;
				fieldId = findField(this.map, fieldIndex);
				fillValue = fill;
			} else {
				log('  type: fixed-field');
				const ids = Object.keys(filler[friendlyKey]);
				if (ids.length !== 1) {
					throw new Error(`${friendlyKey} has more than 1 field to fill`);
				}
				fieldIndex = ids[0];
				log('  index id:', chalk.blue(fieldIndex));
				fieldId = findField(this.map, fieldIndex);
				fillValue = this.evalTemplate(
					this.ctx, filler[friendlyKey][fieldIndex]);
			}
			if (!fieldId) {
				throw new Error(`failed to find field index '${fieldIndex}' in field map`);
			}

			for (const key in this.endsWithFuncs) {
				if (friendlyKey.endsWith(key)) {
					fillValue = this.endsWithFuncs[key](fillValue);
				}
			}

			// if (fillValue === 'NaN') {
			// 	throw new Error(`got NaN from ${friendlyKey}`);
			// }

			log('input', chalk.cyan(friendlyKey), '=>',
				chalk.cyan(fieldIndex), '=>', chalk.cyan(fieldId));

			fillFormField(this.ctx, this.formName, friendlyKey, fieldId, fillValue);
		}
	}

	/**
	 * Opens the PDF `source` form, fills out the form and writes it to
	 * `dest`.
	 *
	 * @param {string} source - The source PDF document.
	 * @param {string} dest - The dest PDF document.
	 * @public
	 * @async
	 */
	async save(dest) {
		log('fill', { source: this.sourcePdf, dest });
		const filled = this.ctx.forms[this.formName];
		return pdfFiller.fillFormWithFlattenAsync(
			this.sourcePdf, dest, filled, false);
	}

	/**
	 * @private
	 */
	evalTemplate(data, template) {
		log('evalTemplate', template);
		const validator = {
			get(target, key) {
				if (typeof target[key] === 'object' && target[key] !== null) {
					return new Proxy(target[key], validator);
				} else {
					if (!Reflect.has(target, key)) {
						return '';
					}
					return target[key];
				}
			}
		};
		const proxyCtx = new Proxy(data, validator);

		try {
			const fn = new Function(
				'ctx',
				...this.helperNames,
				'return `' + template + '`;'
			);
			return fn.call(null, proxyCtx, ...this.helpers) || '';
		} catch (ex) {
			log(`error with template: ${template}`, ex);
			throw ex;
		}
	}

	/**
	 * @private
	 */
	evalCalculate(data, template, value) {
		log('evalCalculate', template);
		try {
			const fn = new Function(...this.helperNames, `return ${template}`);
			const result = fn.call(null, ...this.helpers)(data, value);

			if (typeof result !== 'object'
				|| result.field === undefined
				|| result.fill === undefined) {
				log('invalid calculate return value', template);
				throw new Error('calculate functions should return an object: { field, fill }');
			}

			return result;
		} catch (ex) {
			log(chalk.red(`error with template: ${template}`));
			throw ex;
		}
	}
}

/**
 * @private
 */
function findField(map, fieldIndex) {
	for (const fieldId in map) {
		if (map[fieldId] === fieldIndex) {
			return fieldId;
		}
	}
}

/**
 * @private
 */
function fillFormField(ctx, formName, friendlyKey, fieldId, value) {
	// Fill the form field with the value
	ctx.forms[formName][fieldId] = value;
	log(`filling ctx.forms['${chalk.yellow(formName)}']['${chalk.yellow(fieldId)}'] = '${value}'`);

	// Also fill the friendly key
	ctx.forms[formName][friendlyKey] = value;
	log(`filling ctx.forms['${chalk.yellow(formName)}']['${chalk.yellow(friendlyKey)}'] = '${value}'`);
}

/**
 * @private
 */
function ensureNotUsingReservedKeys(inputs) {
	const RESERVED_KEYS = [
		'forms'
	];
	const keys = Object.keys(inputs);
	for (const key of keys) {
		if (RESERVED_KEYS.includes(key)) {
			throw new Error(`You cannot use a reserved key: ${key}`);
		}
	}
}

/**
 * @private
 */
async function loadYAML(filename) {
	if (typeof filename !== 'string') {
		// not a filename
		return filename;
	}
	await afs.access(filename, fs.constants.R_OK);
	return YAML.safeLoad(await afs.readFile(filename));
}

module.exports = Form;
