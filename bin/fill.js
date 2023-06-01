#!/usr/bin/env node
import { Form } from '../src/index.js';

const { argv } = require('yargs')
	.command(
		'* <source> [-m map] [-f filler] [-i input] [-o output]',
		'Fill a PDF form.',
		(yargs) => {
			yargs.positional('source', {
				describe: 'The PDF file to fill.',
				type: 'string',
				required: true
			}).option(
				'config', {
					alias: 'f',
					description: 'The config file.',
					required: true
				}
			).option(
				'map', {
					alias: 'm',
					description: 'The map file.',
					required: true
				}
			).option(
				'script', {
					alias: 's',
					description: 'The form filler script.',
					required: true
				}
			).option(
				'output', {
					alias: 'o',
					description: 'The output file.',
					default: 'output.pdf'
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

const form = new Form();

form.init(argv.config)
	.then(() => form.load(argv.source, argv.map))
	.then(() => form.fill(argv.script))
	.then(() => form.save(argv.output))
	.then(() => {
		console.log('Done');
	})
	.catch((err) => {
		console.error(err.message);
		process.exit(-1);
	});
