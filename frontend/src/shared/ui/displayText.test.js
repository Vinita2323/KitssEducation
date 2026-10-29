import test from 'node:test';
import assert from 'node:assert/strict';
import { statusLabel, userMessage, fieldLabel } from './displayText.js';
import { ApiError, createHttpClient } from '../api/httpClient.js';

test('unavailable states remain unavailable and Test Mode is never hidden', () => {
  assert.equal(statusLabel('configuration_required'), 'Not available yet');
  assert.equal(statusLabel('quarantined'), 'Awaiting security check');
  assert.equal(statusLabel('captured'), 'Payment confirmed');
  assert.equal(userMessage('Razorpay Test Mode only'), 'Razorpay Test Mode only');
  assert.equal(userMessage('Application blocked: missing documents'), 'Application unavailable: missing documents');
  assert.equal(statusLabel('not_executed'), 'Not processed');
  assert.equal(fieldLabel('amountMinor'), 'Amount (paise)');
  assert.equal(fieldLabel('registrationFees'), 'Registration fees');
});

test('plain-language API errors preserve machine codes, status, request references and details', async () => {
  const fields = [{ path: 'documents', message: 'Required' }];
  const client = createHttpClient({ fetchImpl: async () => new Response(JSON.stringify({ error: { code: 'CONFIGURATION_REQUIRED', message: 'Configuration required: approve document requirements.', fields }, data: { available: false } }), { status: 422, headers: { 'Content-Type': 'application/json', 'X-Request-ID': 'test-reference' } }) });
  await assert.rejects(client.request('/example'), error => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.code, 'CONFIGURATION_REQUIRED'); assert.equal(error.status, 422);
    assert.equal(error.requestId, 'test-reference'); assert.deepEqual(error.fields, fields);
    assert.deepEqual(error.data, { available: false });
    assert.equal(error.message, 'Not available yet. approve document requirements.');
    return true;
  });
});
