import { createInterface } from 'node:readline/promises';
import { loadConfig } from '../../config/env.js';
import { createDatabase } from '../../config/database.js';
import { createLogger } from '../../config/logger.js';
import { createAuthModels } from './auth.models.js';
import { createAuthService } from './auth.service.js';
import { createEmailService } from '../email/email.service.js';

// Explicit operator CLI only. Password arrives on stdin, never argv or logs.
// PowerShell instructions in README use SecureString + redirected stdin.
let database;
try {
  const config = loadConfig();
  if (process.env.KITSS_ALLOW_BOOTSTRAP !== 'true' || !process.env.KITSS_BOOTSTRAP_EMAIL || !process.env.KITSS_BOOTSTRAP_NAME) throw new Error('Explicit bootstrap configuration required');
  const mail = createEmailService(config.smtp, createLogger({ level: 'silent' }));
  if (!mail.configured) throw new Error('Configure SMTP first');
  const input = createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false });
  let password;
  for await (const line of input) { password = line; input.close(); break; }
  const logger = createLogger({ level: 'silent' });
  database = createDatabase(config.mongo, logger);
  await database.connect();
  const service = await createAuthService({ models: createAuthModels(database.connection), config, mail, logger });
  await service.initialize();
  const result = await service.bootstrap({ name: process.env.KITSS_BOOTSTRAP_NAME, email: process.env.KITSS_BOOTSTRAP_EMAIL, password, allowed: true }, { actorId: 'operator-cli' });
  password = undefined;
  console.log(JSON.stringify({ message: result.message, challengeId: result.challengeId }));
} catch { console.error('Bootstrap failed. Check operator flags, SMTP, password policy and whether an initial administrator already exists. No credentials were printed.'); process.exitCode = 1; }
finally { await database?.disconnect(); }
