// Presentation only: stored statuses, error codes and permission decisions stay unchanged.
export function userMessage(value) {
  const text = String(value ?? '');
  const messages = {
    'Invalid API response': 'We could not read the response. Please try again.',
    'API request failed': 'Your request could not be completed. Please try again.',
    'API request timed out': 'This is taking too long. Please try again.',
    'API request cancelled': 'Request cancelled.',
    'Could not reach the API': 'Unable to connect. Check your connection and try again.',
  };
  if (messages[text]) return messages[text];
  return text
    .replace(/\bconfiguration required\b:?\s*/gi, 'Not available yet. ')
    .replace(/\bblocked\b/gi, 'unavailable')
    .replace(/\bbackend\b/gi, 'service')
    .replace(/\bprovider verification\b/gi, 'payment confirmation')
    .replace(/\bentitlements?\b/gi, 'access')
    .replace(/\b(?:implementation|integration) (?:is )?pending\b/gi, 'not available yet');
}

export function statusLabel(value) {
  if (value === undefined || value === null || value === '') return 'Not available';
  const labels = {
    configuration_required: 'Not available yet', policy_pending: 'Not available yet',
    quarantined: 'Awaiting security check', pending_capture: 'Awaiting payment confirmation',
    captured: 'Payment confirmed', authorized: 'Awaiting payment confirmation',
    not_executed: 'Not processed', entitlements_pending: 'Access not ready',
    approval_blocked: 'Approval unavailable', applied: 'Ready', not_applied: 'Not ready',
    leased: 'Processing', dead: 'Needs attention', done: 'Completed',
  };
  return labels[value] || userMessage(String(value).replaceAll('_', ' '));
}

export function fieldLabel(value) {
  const labels = { fieldSchema: 'Verification questions (JSON)', source: 'Source details',
    userId: 'User reference', resourceId: 'Book or course reference', expiresAt: 'Access ends',
    sellerName: 'Seller name', sellerAddress: 'Seller address', sellerTaxId: 'Seller tax reference',
    taxPolicyNote: 'Tax information', effectiveFrom: 'Starts on', effectiveTo: 'Ends on',
    amountMinor: 'Amount (paise)', brand: 'Branding', support: 'Contact and support',
    footer: 'Footer', registrationFees: 'Registration fees', publicFeatures: 'Feature availability (read only)' };
  const text = String(value ?? '');
  return labels[text] || text.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());
}
