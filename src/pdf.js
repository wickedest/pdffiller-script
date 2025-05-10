import fs from 'fs/promises';
import path from 'path';
import debug from 'debug';
import { PDFDocument } from '@cantoo/pdf-lib';

const log = debug('pdffiller-script');

export default class PDF {
	/**
	 * **Warning**: Do not call directly, use `PDF.open`.
	 *
	 * @param {PDFDocument} pdfDoc - The PDF document.
	 * @param {string} [name] - The PDF name.
	 */
	constructor (pdfDoc, name) {
		this.doc = pdfDoc;
		this.name = name;
		this.form = pdfDoc.getForm();
	}

	/**
	 * Opens a PDF form.
	 *
	 * @param {string} fileName - The path to the PDF file to open.
	 * @returns {PDF} A PDF for filling.
	 */
	static async open(fileName) {
		log('open', fileName);
		const name = path.basename(fileName);
		const pdfBytes = await fs.readFile(fileName);
		const pdfDoc = await PDFDocument.load(pdfBytes);
		return new PDF(pdfDoc, name);
	}

	/**
	 * Gets the form template.
	 * @returns {object} A PDF form template.
	 */
	getTemplate() {
		return this.form.getFields().reduce((agg, field) => {
			agg[field.getName()] = '';
			return agg;
		}, {});
	}

	/**
	 * Fills out a form using `filledTemplate`.
	 *
	 * @param {object} filledTemplate
	 */
	async fillForm(filledTemplate) {
		for (const key in filledTemplate) {
			log('filling:', key, 'with:', filledTemplate[key]);
			const field = this.form.getFieldMaybe(key);
			if (!field) {
				log('no field named:', key);
				continue;
			}

			const fieldType = field.constructor.name;
			if (fieldType === 'PDFTextField') {
				const field = this.form.getTextField(key);
				try {
					field.setText(filledTemplate[key]);
				} catch (ex) {
					if (`${ex}`.indexOf(' must be of type `string`') >= 0) {
						// automatically convert numbers to strings
						field.setText(`${filledTemplate[key]}`);
					} else {
						throw Error(
							`${ex}, form=${this.name} key=${key}, value="${filledTemplate[key]}"`);
					}
				}
			}
			else if (fieldType === 'PDFCheckBox') {
				const value = Number.parseInt(filledTemplate[key]);
				const field = this.form.getCheckBox(key);
				if (value) {
					field.check();
				}
			}
			else {
				log('unknown field type:', fieldType);
			}
		}
	}

	/**
	 * Slice pages from `begin` (0-based, inclusive) to `end` (exclusive).
	 *
	 * @param {int} begin - The index of the page to slice from.
	 * @param {int} end - The index of the page to slice to.
	 * @returns {PDF} The new PDF.
	 */
	async slice(begin, end) {
		// create an index from begin..end (-1), so
		// [begin(1)..end(3)] => [0, 1, 2]
		if (begin < 0) {
			throw Error('begin value must be >= 0');
		}
		if (end < 0) {
			throw Error('end value must be >= 0');
		}
		if (end < begin) {
			throw Error('end value must be >= begin');
		}
		const numPages = this.doc.getPageCount();
		if (end > numPages) {
			throw Error(`end index out of bounds (${end} <= ${numPages})`);
		}

		const pageIdx = Array.from({length: end - begin}, (_, i) => begin + i);
		const destPdf = await PDFDocument.create();
		const pages = await destPdf.copyPages(this.doc, pageIdx);

		// add all the pages
		for (const page of pages) {
			destPdf.addPage(page);
		}

		// add all the pages
		// pages.map(page => destPdf.addPage);
		return new PDF(destPdf);
	}

	/**
	 * Appends PDF to the current PDF.
	 *
	 * @param {PDF} pdf - The PDF to append.
	 */
	async append(pdf) {
		const begin = 0;
		const end = pdf.doc.getPageCount();
		const pageIdx = Array.from({length: end - begin}, (_, i) => begin + i);
		const pages = await this.doc.copyPages(pdf.doc, pageIdx);
		for (const page of pages) {
			this.doc.addPage(page);
		}
	}

	/**
	 * Saves the PDF to file.
	 *
	 * @param {str} dest - The destination file name.
	 * @param {bool} [flatten=true] - Flattens the PDF form before saving.
	 * @returns {Promise}
	 */
	async save(dest, flatten = true) {
		if (flatten) {
			this.form.flatten();
		}
		const pdfBytes = await this.doc.save();
		return fs.writeFile(dest, pdfBytes);
	}
}
