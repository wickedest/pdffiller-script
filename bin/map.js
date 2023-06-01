#!/usr/bin/env node
import chalk from 'chalk';
import yargs from 'yargs';
import { map } from '../src/index.js';

const { argv } = yargs(process.argv.slice(2))
	.command(
		'* <source> [-o out] [-n name] [--example]',
		'Generate a form template from a PDF file.',
		(yargs) => {
			yargs.positional('source', {
				describe: 'The PDF source file.',
				type: 'string',
				required: true
			}).option(
				'out', {
					alias: 'o',
					description: 'The output directory.',
					default: '.'
				}
			).option(
				'name', {
					alias: 'n',
					description: 'The name of YAML template file to generate.  Defaults to the basename of the PDF.'
				}
			).option(
				'example', {
					type: 'boolean',
					description: 'Generate examples (PDF, filler script, and config).',
					default: true
				}
			).alias(
				'v', 'version'
			).alias(
				'h', 'help'
			)
		}
	)
	.help()
	.strict();

map(argv.source, {
	dir: argv.out,
	name: argv.name,
	example: argv.example
}).then(result => {
	console.log(chalk.cyan('created map:', result.map));
	if (result.filled) {
		console.log(chalk.cyan('filled example:', result.filled));
		console.log(chalk.cyan('script example:', result.script));
		console.log(chalk.cyan('config example:', result.config));
		console.log(`\
The example PDF file has been filled out with unique integer ID that correlate
to the map file (field.ID: integer).  You can visually inspect the example PDF
aid in identifying the fields you wish to fill.\
`);
	}
}).catch(err => {
	console.error(err);
});
