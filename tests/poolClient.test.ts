import { test } from 'uvu';
import * as assert from 'uvu/assert';

function goodbyeResponse() {
	return 'So long Matthew!';
}

test.before.each((meta) => {
	console.log(meta['__test__']);
});

test('it returns expected response from goodbyeResponse', () => {
	assert.type(goodbyeResponse, 'function');
	assert.is(goodbyeResponse(), 'So long Matthew!');
});

test.run();
