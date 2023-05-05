import { expect } from 'chai';
import getHelpers from '../src/helpers.js';

const [
	currency,
	currencyDec,
	currencyWhole,
	parseCurrency,
	strCapitalize,
	strNoDash,
	strTrim
] = getHelpers({ locale: 'en-GB' });

describe('helpers', () => {
	it('should export a function', () => {
		expect(getHelpers).to.be.a('function');
	});

	it('should return helper functions with default options', () => {
		const helpers = getHelpers();
		expect(helpers).to.be.an('array')
			.and.have.length(7);
	});

	it('should format currency', () => {
		expect(currency(1234.56)).to.equal('1,234.56');
		expect(currency(1234)).to.equal('1,234.00');
		expect(currency('1234.56')).to.equal('1,234.56');
		expect(currency('1234')).to.equal('1,234.00');
		expect(currency(null)).to.equal('0.00');
		expect(currency(undefined)).to.equal('0.00');
		expect(currency('')).to.equal('0.00');
		expect(currency(0)).to.equal('0.00');
		expect(currency('foo')).to.equal('NaN');
	});

	it('should format currency decimal fraction', () => {
		expect(currencyDec(1234.56)).to.equal('56');
		expect(currencyDec(1234)).to.equal('00');
		expect(currencyDec('1234.56')).to.equal('56');
		expect(currencyDec('1234')).to.equal('00');
		expect(currencyDec(null)).to.equal('00');
		expect(currencyDec(undefined)).to.equal('00');
		expect(currencyDec('')).to.equal('00');
		expect(currencyDec(0)).to.equal('00');
		expect(currencyDec('foo')).to.equal('NaN');
	});

	it('should format currency as a whole number', () => {
		expect(currencyWhole(1234.56)).to.equal('1,235');
		expect(currencyWhole(1234)).to.equal('1,234');
		expect(currencyWhole('1234.56')).to.equal('1,235');
		expect(currencyWhole('1234')).to.equal('1,234');
		expect(currencyWhole(null)).to.equal('0');
		expect(currencyWhole(undefined)).to.equal('0');
		expect(currencyWhole('')).to.equal('0');
		expect(currencyWhole(0)).to.equal('0');
		expect(currencyWhole('foo')).to.equal('NaN');
	});

	it('should parse currency', () => {
		expect(parseCurrency('1234.56')).to.equal(1234.56);
		expect(parseCurrency('1,234.56')).to.equal(1234.56);
		expect(parseCurrency('1234')).to.equal(1234);
		expect(parseCurrency('0')).to.equal(0);
		expect(parseCurrency(null)).to.equal(0);
		expect(parseCurrency(undefined)).to.equal(0);
		expect(parseCurrency('')).to.equal(0);
		expect(parseCurrency(0)).to.equal(0);
		expect(Number.isNaN(parseCurrency('foo'))).to.be.true;
	});

	it('should capitalize', () => {
		expect(strCapitalize('dublin')).to.equal('Dublin');
		expect(strCapitalize('d')).to.equal('D');
		expect(strCapitalize('')).to.equal('');
		expect(strCapitalize(null)).to.equal(null);
		expect(strCapitalize(undefined)).to.equal(undefined);
		expect(strCapitalize(1234)).to.equal(1234);
	});

	it('should strip dashes', () => {
		expect(strNoDash('d-u-b-l-i-n')).to.equal('dublin');
		expect(strNoDash('-dublin-')).to.equal('dublin');
		expect(strNoDash('dublin')).to.equal('dublin');
		expect(strNoDash('')).to.equal('');
		expect(strNoDash(null)).to.equal(null);
		expect(strNoDash(undefined)).to.equal(undefined);
		expect(strNoDash(1234)).to.equal(1234);
	});

	it('should trim whitespace', () => {
		expect(strTrim(' dublin ')).to.equal('dublin');
		expect(strTrim('  ')).to.equal('');
		expect(strTrim(null)).to.equal(null);
		expect(strTrim(undefined)).to.equal(undefined);
		expect(strTrim(1234)).to.equal(1234);
	});
});
