import nodemailer from 'nodemailer';
import { AppError } from '../../utils/AppError.js';

export function createEmailService(config, logger, { transport } = {}) {
  const configured = Boolean(config.host && config.user && config.appPassword && config.from);
  const sender = transport ?? (configured ? nodemailer.createTransport({
    host: config.host, port: config.port, secure: config.secure,
    requireTLS: !config.secure, auth: { user: config.user, pass: config.appPassword },
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true,
  }) : null);
  return {
    configured: Boolean(sender),
    async send({ to, purpose, code, link, ttlMinutes = 10 }) {
      if (!sender) throw new AppError(503, 'EMAIL_UNAVAILABLE', 'Email delivery is unavailable; please try again later');
      const subjects = { verify: 'Verify your KITSS email', reset: 'Reset your KITSS password', invite: 'Your KITSS staff invitation', emailChange: 'Confirm your KITSS email change' };
      const text = purpose === 'invite'
        ? `You have been invited to KITSS Education. Open this single-use link within 24 hours to set your password, then verify your email:\n${link}\nIf unexpected, ignore this email.`
        : `Your KITSS ${purpose === 'reset' ? 'password recovery' : 'email verification'} code is ${code}. It expires in ${ttlMinutes} minutes. Do not share it. If unexpected, ignore this email.`;
      try {
        const result = await sender.sendMail({ from: config.from, to, subject: subjects[purpose], text });
        if (!result.accepted?.length || result.rejected?.length) throw new Error('SMTP did not accept message');
      } catch {
        logger.error({ event: 'email_delivery_failed', purpose }, 'SMTP delivery failed');
        throw new AppError(503, 'EMAIL_UNAVAILABLE', 'Email delivery is unavailable; please try again later');
      }
    },
  };
}
