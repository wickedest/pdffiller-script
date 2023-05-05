import { expect } from 'chai';
import * as API from '../src/index.js';

describe('index', () => {
	it('should export API', () => {
		expect(API).to.be.a('Module');
		expect(API).to.have.property('Form')
			.and.to.be.a('function');
		expect(API).to.have.property('map')
			.and.to.be.a('function');
	});
});
