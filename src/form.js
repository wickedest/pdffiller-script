import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import YAML from 'js-yaml';
import debug from 'debug';
import getHelpers from './helpers.js';
import PDF from './pdf.js';

const log = debug('pdffiller-script');

/**
 * Creates a fillable form from a PDF.
 */
class Form {
	/**
	 * Initialize the form.  The `config` be a string or an object.  If it is
	 * a string, it is a path to a YAML file.
	 *
	 * @param {string|object} config - The config file to use when filling
	 * forms.
	 */
	async init(config) {
		log('init', config);
		ensureNotUsingReservedKeys(config);
		try {
			this.config = await loadYAML(config);
		} catch (ex) {
			throw new Error(`Invalid config YAML "${config}": ${ex}`);
		}
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
	 * Loads a PDF source and map file.  The `source` is a path to a PDF file
	 * that will be used to fill.  The `map` can be a string or an object.  If
	 * it is a string, it is a path to a YAML file.  The `map` was previously
	 * generated from a PDF document using the {@link map} function.
	 *
	 * @param {string} source - The PDF source.
	 * @param {string|object} map - The map generated from {@link map}.
	 *
	 * @public
	 * @async
	 */
	async load(source, map) {
		log('load', source, map);
		// TODO: check `source` exists
		this.formName = path.basename(source, '.pdf');
		this.sourcePdf = source;
		try {
			this.map = await loadYAML(map);
		} catch (ex) {
			throw new Error(`Invalid map YAML "${map}": ${ex}`);
		}
		this.setFormName(this.formName);
	}

	/**
	 * Change the context reference name for the form.  By default is is the
	 * `path.basename` of the `source` PDF provided in {@link load} function.
	 * When evaluating form fields, inputs will be saved under this new name,
	 * and can be referenced from the scripts.
	 *
	 * @param {string} name - A friendly form name.
	 *
	 * @example
	 * await form.load(path.join('forms', 'banana-order-form.pdf'));
	 * form.setFormName('banana');
	 * // reference in scripts: ctx.forms["banana"]
	 *
	 * @public
	 */
	setFormName(name) {
		log('setFormName', name);
		this.formName = name;
		this.ctx.forms[this.formName] = {};
	}

	/**
	 * Change the source PDF name.  By default, this is the the `source` PDF
	 * path provided in {@link load} function.  It allows the source PDF to be
	 * changed prior to calling {@link slice} or {@link save}.
	 *
	 * @param {string} source - The PDF source.
	 *
	 * @example
	 * await form.load(path.join('forms', 'A.pdf'));
	 * await form.fill(script); // fill A
	 * form.setSourcePDF('A-part2.pdf'); // change source PDF
	 * await form.slice(3, 4', 'A2.pdf'); // slice pages 3-4 into A2.pdf
	 * form.setFormName('A2');
	 * await form.fill(script2); // fill A2
	 * form.setSourcePDF('A.pdf'); // change source PDF back to A.pdf
	 * await form.join([ 'A2.pdf' ], 'A.pdf');
	 *
	 * @public
	 */
	setSourcePDF(source) {
		log('setSourcePDF', source);
		this.sourcePdf = source;
	}

	/**
	 * HelperFunction definition
	 * @typedef {HelperFunction} HelperFunction
	 * @param {number|string} val
	 * @returns {number|string} The converted `val`.
	 */
	/**
	 * Registers friendly key helpers for use with the script.  By default, the
	 * following key helpers are registered:
	 *
	 * - **.currency**: The value is a currency, meaning that it will be
	 * parsed as a decimal and written to the form as a declimal with two
	 * decimal places.
	 * - **.dec**: Returns the decimal part of a currency.
	 * - **.whole**: Returns the whole integer part of a currency.
	 * - **.nodash**: Strips dashes from a string.
	 *
	 * @param {object} funcs - A map of function suffix to {@link HelperFunction}.
	 * @example
	 * form.registerFriendlyKeyHelpers({
	 *   '.lowercase': (value) => value !== undefined ? value.toLowerCase() : ''
	 * });
	 *
	 * @public
	 */
	registerFriendlyKeyHelpers(funcs) {
		log('registerFriendlyKeyHelpers', funcs);
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
	 * @param {object} [options = {}] - Fill options.
	 * @param {string} [options.debug] - Enables a `debugger` breakpoint when
	 * the specified field name is being filled.  Useful for debugging a
	 * problematic input field.
	 *
	 * @public
	 * @async
	 */
	async fill(filler, options = {}) {
		log('fill', filler, options);
		filler = await loadYAML(filler);
		for (const friendlyKey in filler) {
			let fieldId;
			let fieldIndex;
			let fillValue;

			log(chalk.blue(friendlyKey));

			if (options.debug) {
				if (friendlyKey === options.debug) {
					// eslint-disable-next-line no-debugger
					debugger;
				}
			}

			let calculatedInput;
			if (filler[friendlyKey].value) {
				// calculation. first, compute the value
				calculatedInput = this.evalTemplate(
					this.ctx, filler[friendlyKey].value);

				// run calculate
				const { field, fill } = this.evalCalculate(
					this.ctx, filler[friendlyKey].calculate, calculatedInput);

				fieldIndex = field;
				fieldId = findField(this.map, fieldIndex);
				fillValue = fill;
			} else {
				// fixed-field
				const ids = Object.keys(filler[friendlyKey]);
				if (ids.length !== 1) {
					throw new Error(`${friendlyKey} has more than 1 field to fill`);
				}
				fieldIndex = ids[0];
				fieldId = findField(this.map, fieldIndex);

				fillValue = this.evalTemplate(
					this.ctx, filler[friendlyKey][fieldIndex]);

				if (options.allowNaN === false
					&& (fillValue === undefined || Number.isNaN(fillValue) || fillValue === 'NaN')
				) {
					log('failing template:');
					log(chalk.gray(filler[friendlyKey][fieldIndex]));
					throw new Error(
						`NaN evaluating calculated field '${fieldIndex}' in script ${this.formName}.yaml > ${friendlyKey} > ${filler[friendlyKey].value}, with input "${calculatedInput}". It could mean that the ${this.formName}-map.yaml file is out of sync with the filler script.`);
				}
			}
			if (!fieldId) {
				log(this.map);
				if (filler[friendlyKey].value) {
					throw new Error(
						`failed to find calculated field '${fieldIndex}' in script ${this.formName}.yaml > ${friendlyKey} > ${filler[friendlyKey].value}, with input "${calculatedInput}". It could mean that the ${this.formName}-map.yaml file is out of sync with the filler script.`);
				} else {
					throw new Error(
						`failed to find field '${fieldIndex}' in script ${this.formName}.yaml > ${friendlyKey}. It could mean that the ${this.formName}-map.yaml file is out of sync with the filler script.`);
				}
			}

			log('  input', chalk.cyan(friendlyKey), '=>',
				chalk.cyan(fieldIndex), '=>', chalk.cyan(fieldId));

			this.fillFormField(
				this.ctx, this.formName, friendlyKey, fieldId, fillValue);
		}
	}

	/**
	 * Opens the PDF `source` form, fills out the form and writes it to `dest`.
	 *
	 * @param {string} source - The source PDF document.
	 * @param {string} dest - The dest PDF document.
	 *
	 * @public
	 * @async
	 */
	async save(dest, { begin, end, flatten = true } = {}) {
		log('save', { source: this.sourcePdf, dest });
		const filled = this.ctx.forms[this.formName];
		for (const key in filled) {
			if (filled[key] === null) {
				// fix null values (maybe delete?)
				filled[key] = '';
			}
		}
		const pdf = await PDF.open(this.sourcePdf);
		pdf.fillForm(filled);

		if (begin !== undefined && end !== undefined) {
			if (flatten) {
				pdf.form.flatten();
			}
			const copied = await pdf.slice(begin - 1, end);
			return copied.save(dest);
		}
		return pdf.save(dest, false);
	}

	/**
	 * Copy pages out of the PDF and saves it to `dest`.  Can be used in
	 * conjunction with {@link setSourcePDF} to change the source PDF used
	 * for slicing pages.
	 *
	 * @param {integer} begin - The page number to slice from, inclusive.
	 * @param {integer} end - The page number to slice to, inclusive.
	 * @param {string} dest - The destination PDF file to write.
	 *
	 * @public
	 * @async
	 */
	async slice(begin, end, dest) {
		log('slice', { begin, end, dest });

		const pdf = await PDF.open(this.sourcePdf);
		// Inputs are 1-based index and inclusive, so 1, 3 should copy pages
		// 1, 2, and 3. This translates to begin=0 (inclusive) and
		// end=3 (exclusive). To copy: [0, 1, 2]
		const copied = await pdf.slice(begin - 1, end);
		return copied.save(dest);
	}

	/**
	 * Join multiple PDF `parts` into a new PDF `dest`.
	 *
	 * @param {PDF} dest -
	 * @param {string[]} parts -
	 *
	 * @public
	 * @async
	 */
	async join(dest, parts) {
		if (!parts.length) {
			return;
		}
		const part = parts.shift();
		const pdf = await PDF.open(part);

		for (const fname of parts) {
			log('join', { part: fname });
			const partPdf = await PDF.open(fname);
			await pdf.append(partPdf);
		}
		return pdf.save(dest);
	}

	// async append(parts, dest, { pages = null }) {
	// 	for (const part of parts) {
	// 		const pdf = await PDF.open(part);
	// 		const [begin, end] = pages;
	// 		const subsetPdf = pdf.slice(begin, end);
	// 		await pdf.append(partPdf);
	// 	}
	// }

	/**
	 * @private
	 */
	evalTemplate(data, template) {
		const validator = {
			get(target, key) {
				if (target[key] !== null && typeof target[key] === 'object') {
					return new Proxy(target[key], validator);
				} else {
					if (!Reflect.has(target, key)) {
						if (data.forms === target) {
							// This is a missing form
							return {};
						}
						// By returning `null`, as opposed to `undefined`, js can handle
						// things like `1234 + null = 1234`
						return null;
					}
					return target[key];
				}
			}
		};
		const proxyCtx = new Proxy(data, validator);

		try {
			const fn = new Function(...this.helperNames, `return (ctx) => ${template}`);
			const result = fn.call(null, ...this.helpers)(proxyCtx);
			return result;
		} catch (ex) {
			log(chalk.red(`error with template: ${template}`));
			throw ex;
		}
	}

	/**
	 * @private
	 */
	evalCalculate(data, template, value) {
		log(chalk.grey('  evalCalculate:', template, `, value=${JSON.stringify(value)}`));
		try {
			const fn = new Function(...this.helperNames, `return ${template}`);
			const result = fn.call(null, ...this.helpers)(data, value);

			if (typeof result !== 'object'
				|| result.field === undefined
				|| result.fill === undefined) {
				log('  invalid calculate return value', template);
				throw new Error('calculate functions should return an object: { field, fill }');
			}

			return result;
		} catch (ex) {
			log(chalk.red(`error with template: ${template}`));
			throw ex;
		}
	}

	/**
	 * @private
	 */
	fillFormField(ctx, formName, friendlyKey, fieldId, value) {
		let convertedValue = value;
		let persistedValue = value;
		for (const key in this.endsWithFuncs) {
			if (friendlyKey.endsWith(key)) {
				// auto-convert
				convertedValue = this.endsWithFuncs[key](value);
				break;
			}
		}
		if (convertedValue === null || convertedValue === undefined) {
			convertedValue = '';
		}

		// Fill the form field with the converted value
		ctx.forms[formName][fieldId] = convertedValue;
		log(`[${chalk.green(formName)}] ${chalk.green(fieldId)} =`,
			chalk.green(JSON.stringify(convertedValue)));

		// Also fill the friendly key with the persisted value
		ctx.forms[formName][friendlyKey] = persistedValue;
		log(`[${chalk.green(formName)}] ${chalk.green(friendlyKey)} =`,
			chalk.green(JSON.stringify(persistedValue)));
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
	await fs.access(filename, fs.constants.R_OK);
	return YAML.safeLoad(await fs.readFile(filename));
}

export default Form;
