import { loadConfig } from '../src/config/env.js';
import { approveRotatedTestCredentials } from '../src/modules/commerce/payment-provider.js';

if (!process.argv.includes('--confirm-rotated-test-credentials')) {
  console.error('Not executed. First rotate API and webhook secrets, configure Test Mode, then deliberately confirm with --confirm-rotated-test-credentials.');
  process.exitCode = 1;
} else {
  try { await approveRotatedTestCredentials(loadConfig().payment); console.info('Read-only Test Mode authentication validated. Local approval expires in seven days or on any credential change. No order or payment was created.'); }
  catch { console.error('Approval failed. Confirm rotated Test Mode configuration without sharing credentials.'); process.exitCode = 1; }
}
