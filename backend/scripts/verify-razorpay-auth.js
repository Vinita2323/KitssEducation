import { loadConfig } from '../src/config/env.js';
import { configuredProvider } from '../src/modules/commerce/payment-provider.js';

if (process.argv.length !== 3 || process.argv[2] !== '--confirm-test-key-use') {
  console.error('Not executed. Explicitly authorize the read-only Test Mode credential check with --confirm-test-key-use. No credentials belong in command arguments.');
  process.exitCode = 1;
} else {
  try {
    const provider = await configuredProvider(loadConfig().payment);
    console.info(JSON.stringify(await provider.verifyTestAuthentication()));
  } catch {
    console.error('Read-only Test Mode authentication was not verified. No order, payment or approval was created; check private configuration with the account owner.');
    process.exitCode = 1;
  }
}
