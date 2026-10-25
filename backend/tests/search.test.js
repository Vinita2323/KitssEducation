import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeRegex } from '../src/utils/escapeRegex.js';
test('search treats regex syntax, Unicode and backslashes as literal text', () => {
  for (const value of ['[.*', 'a+b?', '^start$', '(a|b){2}', 'folder\\file', 'Class 10', 'Hindi - हिंदी']) {
    const expression = new RegExp('^' + escapeRegex(value) + '$', 'i');
    assert.equal(expression.test(value), true);
    assert.equal(expression.test('unrelated'), false);
  }
  assert.equal(new RegExp(escapeRegex('.*')).test('any course'), false);
});
