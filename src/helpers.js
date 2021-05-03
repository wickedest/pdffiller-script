const chalk = require('chalk');
const log = require('debug')('pdffiller-script');

function getHelpers(config = {}) {
	const formatWhole = new Intl.NumberFormat(config.locale || 'en-GB', {
		maximumFractionDigits: 0
	});
	const formatDecimal = new Intl.NumberFormat(config.locale || 'en-GB', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
	const exampleCurrency = formatDecimal.format(1234.56);
	const thousandsSep = exampleCurrency[1];
	const fractionSep = exampleCurrency.substr(-3)[0];

	/**
	 *
	 */
	function currency(number) {
		log(chalk.grey(`  currency(${JSON.stringify(number)})`));
		if (number === undefined) {
			return '0.00';
		}
		if (typeof number === 'string') {
			number = parseCurrency(number);
		}
		return `${formatDecimal.format(number)}`;
	}

	/**
	 *
	 */
	function currencyDec(number) {
		log(chalk.grey(`  currencyDec(${JSON.stringify(number)})`));
		const cur = currency(number);
		if (cur === 'NaN') {
			return cur;
		}
		return `${cur.substr(-2)}`;
	}

	/**
	 *
	 */
	function currencyWhole(number) {
		if (number === undefined) {
			return '0';
		}
		if (typeof number === 'string') {
			number = parseCurrency(number);
		}
		const result = `${formatWhole.format(number)}`;
		log(chalk.grey(`  currencyWhole(${JSON.stringify(number)}) => ${JSON.stringify(result)}`));
		return result;
	}

	/**
	 *
	 */
	function parseCurrency(val) {
		log(chalk.grey(`  parseCurrency(${JSON.stringify(val)})`));
		if (val === undefined || val === null || val === '') {
			return 0;
		}
		if (typeof val !== 'string') {
			return val;
		}
		val = val.trim();
		if (val.indexOf(fractionSep) >= 0) {
			// this is a value with a decimal fraction	
			return parseFloat(val.replace(thousandsSep, ''));
		} else {
			// this is a whole value with no decimal fraction
			return parseInt(val);
		}
	}

	/**
	 * Capitalize the first letter of a string.
	 *
	 * @public
	 * @param {string} val - The value to capitalize.
	 * @return {string} The `val` with the first letter capitalized.
	 */
	function strCapitalize(val) {
		log(chalk.grey(`  strCapitalize(${JSON.stringify(val)})`));
		if (!val || !val.substr) {
			return val;
		}
		return val.substr(0, 1).toLocaleUpperCase(config.locale || 'en-GB')
			+ val.substr(1);
	}

	/**
	 *
	 */
	function strNoDash(val) {
		log(chalk.grey(`  strNoDash(${JSON.stringify(val)})`));
		if (!val || !val.replace) {
			return val;
		}
		return val.replace(/-/g, '');
	}

	/**
	 *
	 */
	function strTrim(val) {
		log(chalk.grey(`  strTrim(${JSON.stringify(val)})`));
		if (!val || !val.trim) {
			return val;
		}
		return val.trim();
	}

	return [
		currency,
		currencyDec,
		currencyWhole,
		parseCurrency,
		strCapitalize,
		strNoDash,
		strTrim
	];
}

module.exports = getHelpers;
