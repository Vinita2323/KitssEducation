import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { backendRoot, loadConfig } from '../src/config/env.js';
import { createEmailService } from '../src/modules/email/email.service.js';
import { createLogger } from '../src/config/logger.js';

// No startup hook or public route invokes this command. It is deliberately opt-in.
export async function runSmtpAcceptance(args, {
  getConfig = loadConfig,
  makeMail = createEmailService,
  reserveSend = async () => {
    const directory = path.join(backendRoot, '.runtime');
    await mkdir(directory, { recursive: true });
    // A completed/uncertain six-message workflow run consumes this stage's
    // budget too; a diagnostic must not become an accidental seventh email.
    let workflowReserved = false;
    try { await access(path.join(directory, 'stage11-smtp-workflows-reserved.json')); workflowReserved = true; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (workflowReserved) throw new Error('Stage 11 message budget already reserved');
    // Reserve before sending: interruption/uncertain delivery never auto-retries.
    await writeFile(path.join(directory, 'stage11-smtp-send-reserved.json'),
      JSON.stringify({ reservedAt: new Date().toISOString(), messageLimit: 1 }), { flag: 'wx', mode: 0o600 });
  },
} = {}) {
  const flags = new Set(args);
  if (flags.size !== args.length || args.some(a => !['--confirm-local-smtp-use', '--verify', '--send-test-to-self'].includes(a)) ||
      !flags.has('--confirm-local-smtp-use') || flags.has('--verify') === flags.has('--send-test-to-self')) {
    throw new Error('Choose --verify OR --send-test-to-self and confirm authorized use of the privately configured app password with --confirm-local-smtp-use. No credentials belong in command arguments.');
  }
  const { smtp } = getConfig();
  if (smtp.host !== 'smtp.gmail.com' || smtp.port !== 587 || smtp.secure || !smtp.appPassword || !smtp.user || smtp.user !== smtp.from) {
    throw new Error('Configure authorized Gmail credentials, port 587 STARTTLS and matching SMTP_USER / SMTP_FROM privately.');
  }
  const mail = makeMail(smtp, createLogger({ level: 'silent' }));
  const connection = await mail.verify();
  if (flags.has('--verify')) return { ...connection, messageSent: false };
  await reserveSend();
  const delivery = await mail.sendDiagnostic(smtp.from);
  return { ...connection, ...delivery, messageSent: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { console.info(JSON.stringify(await runSmtpAcceptance(process.argv.slice(2)))); }
  catch { console.error('SMTP acceptance not completed. Check the explicit flags, private configuration and message reservation. No credential or provider error details are logged.'); process.exitCode = 1; }
}
