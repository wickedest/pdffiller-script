const { expect } = require('chai');
const API = require('../');

describe('index', () => {
	it('should export API', () => {
		expect(API).to.be.an('object');
		expect(API).to.have.property('Form')
			.and.to.be.a('function');
		expect(API).to.have.property('map')
			.and.to.be.a('function');
	});
});
