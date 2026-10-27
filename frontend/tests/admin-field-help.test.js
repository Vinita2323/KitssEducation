import test from 'node:test';
import assert from 'node:assert/strict';
import { adminFieldHelp } from '../src/modules/admin/components/adminFieldHelp.js';

test('obvious controls and filters have no automatic hint', () => {
  for (const label of ['Staff email','Password','Remember Me','Book title','Name','Search books','Board','Class','Status','Start date','End date','Payment environment','Notification category','Setting email']) assert.equal(adminFieldHelp(label), '', label);
  assert.equal(adminFieldHelp('Select all books', { type: 'checkbox' }), '');
  assert.equal(adminFieldHelp('Additional field'), '');
});
test('prices distinguish rupees from minor units', () => {
  assert.match(adminFieldHelp('Book price'), /rupees/);
  assert.match(adminFieldHelp('Plan priceMinor'), /100 paise/);
  assert.match(adminFieldHelp('Approved amount (INR minor units)'), /100 paise/);
});
test('technical file and structured formats retain concise guidance', () => {
  assert.match(adminFieldHelp('Upload lesson video', { type: 'file', accept: '.mp4' }), /scanning/);
  assert.match(adminFieldHelp('Upload lesson video', { type: 'file', accept: '.mp4' }), /\.mp4/);
  assert.match(adminFieldHelp('Result JSON'), /supported JSON/);
  assert.match(adminFieldHelp('Section key 3'), /stable/);
});
test('consequential policy fields retain their boundary', () => {
  assert.match(adminFieldHelp('Approved retention days'), /does not authorize deletion/);
  assert.match(adminFieldHelp('Access after confirmed provider refund'), /does not issue a refund/);
  assert.match(adminFieldHelp('Permission preset'), /grant only/);
});
test('native limits stay native rather than becoming visible boilerplate', () => {
  const props = { type: 'date', min: '1970-01-01', max: '9998-12-31', required: true };
  const before = structuredClone(props);
  assert.equal(adminFieldHelp('Start date', props), '');
  assert.deepEqual(props, before);
});
