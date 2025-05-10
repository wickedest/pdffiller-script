import fs from 'fs/promises';
import path from 'path';
import YAML from 'js-yaml';
import debug from 'debug';
import PDF from './pdf.js';

const log = debug('pdffiller-script');

const instructions = [
	'# The `friendly.key.name.N` can be customized to whatever you want.  The keys',
	'# e.g. `1:`, identify the unique field index ID to fill out (which can be',
	'# found in the example filled form) and map to a _value_.  The _value_ of the',
	'# a JavaScript template literal, and be any of the following:',
	'# * A hard-coded value, such as a string, number;',
	'# * Refer to a value from the `ctx`, which is the input file;',
	'# * An object having keys `value`'
];

/**
 * Generates a map from a PDF file and saves as YAML.
 *
 * @param {string} pdfFile - The PDF file containing a form.
 * @param {object} [options={}] - Options.
 * @return {object} An object with `{ map }` that defines the path to the
 *	map file name.
 */
async function map(pdfFile, options = {}) {
	const dir = options.dir || '.';
	const basename = options.name || path.basename(pdfFile, '.pdf');
	const mapFile = path.join(dir, `${basename}-map.yaml`);
	// the "filled" is the PDF form filled with integer values
	const filledFile = path.join(dir, `${basename}-example-filled.pdf`);
	const scriptFile = path.join(dir, `${basename}-example-script.yaml`);
	const configFile = path.join(dir, `${basename}-example-config.yaml`);
	log('mapFile:', mapFile);
	log('filledFile:', filledFile);
	log('scriptFile:', scriptFile);
	log('configFile:', configFile);

	await ensureDirectory(dir);

	// extract the template from PDF
	log('opening PDF file:', pdfFile);

	const pdfDoc = await PDF.open(pdfFile);
	const template = pdfDoc.getTemplate();

	// fill a form, mapping each input ID `key` to a unique index `i`
	const filled = [ ...instructions ];
	const config = {};
	Object.keys(template).forEach((key, i) => {
		template[key] = `${i}`;

		filled.push(`friendly.key.name.${i}:`);
		filled.push(`  # fills ${key}`);
		filled.push(`  ${i}: \${ctx.field${i}}`);

		config[`field${i}`] = 'todo';
	});

	// write the map to YAML
	log('writing map', mapFile);
	await fs.writeFile(mapFile, YAML.safeDump(template));

	if (options.example) {
		// write the example filler script file
		log('writing script', scriptFile);
		await fs.writeFile(scriptFile, filled.join('\n'));

		// write the example config file
		log('writing config', configFile);
		await fs.writeFile(configFile, YAML.safeDump(config));

		// update the form with each input ID `key` filled as unique index `i`
		log('calling fillFormWithFlattenAsync', pdfFile);
		await pdfDoc.fillForm(template, filledFile);

		return {
			map: mapFile,
			filled: filledFile,
			script: scriptFile,
			config: configFile
		};
	}
	return {
		map: mapFile
	};
}

function ensureDirectory(dir) {
	log('ensure dir:', dir);
	return fs.access(dir, fs.constants.R_OK | fs.constants.W_OK)
		.catch(() => {
			log('mkdir:', dir);
			return fs.mkdir(dir);
		});
}

export {
	map
};
