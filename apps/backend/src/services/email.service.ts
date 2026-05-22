/**
 * Email Service — Resend wrapper with dev fallback.
 *
 * If RESEND_API_KEY is missing, the service logs the email body to the
 * console instead of sending it. This lets developers test the password-reset
 * flow locally without configuring a provider.
 */

import { Resend } from 'resend';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

const resendClient: Resend | null = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

if (!resendClient) {
  logger.warn(
    '[email.service] RESEND_API_KEY is not set — outgoing emails will be logged to the console instead of sent.'
  );
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!resendClient) {
    logger.info('[email.service] (dev mode — no API key, email not sent)', {
      to: input.to,
      subject: input.subject,
      bodyText: input.text,
    });
    return;
  }

  const { error } = await resendClient.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    logger.error('[email.service] Resend send failed', { to: input.to, error });
    // We don't surface this to the API caller — password-reset endpoints
    // always respond 200 to avoid leaking which emails exist.
    return;
  }

  logger.info('[email.service] email sent', { to: input.to, subject: input.subject });
}

/**
 * Renders the password-reset email body (HTML + plaintext).
 */
export function renderPasswordResetEmail(args: {
  userName: string;
  resetUrl: string;
  expiresInMinutes: number;
}): { html: string; text: string; subject: string } {
  const { userName, resetUrl, expiresInMinutes } = args;
  const subject = 'Restablecer tu contraseña en Horus';

  const text = `Hola ${userName},

Recibimos una solicitud para restablecer tu contraseña en Horus.

Hacé click en el siguiente link para elegir una nueva contraseña:
${resetUrl}

El link expira en ${expiresInMinutes} minutos. Si no solicitaste el cambio, ignorá este mensaje — tu contraseña actual seguirá funcionando.

— El equipo de Horus`;

  const html = `<!doctype html>
<html lang="es">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; padding: 24px; color: #111827;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700;">Restablecer tu contraseña</h1>
    <p style="margin: 0 0 16px; line-height: 1.6;">Hola <strong>${escapeHtml(userName)}</strong>,</p>
    <p style="margin: 0 0 24px; line-height: 1.6;">
      Recibimos una solicitud para restablecer tu contraseña en Horus. Hacé click en el botón para elegir una nueva:
    </p>
    <p style="margin: 0 0 24px; text-align: center;">
      <a href="${resetUrl}"
         style="display: inline-block; background: linear-gradient(to right, #6366f1, #a855f7); color: white; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 600;">
        Elegir nueva contraseña
      </a>
    </p>
    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">O copiá este link en tu navegador:</p>
    <p style="margin: 0 0 24px; font-size: 14px; word-break: break-all; color: #4f46e5;">${resetUrl}</p>
    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
      El link expira en <strong>${expiresInMinutes} minutos</strong>.
    </p>
    <p style="margin: 0; font-size: 14px; color: #6b7280;">
      Si no solicitaste el cambio, ignorá este mensaje. Tu contraseña actual seguirá funcionando.
    </p>
    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">— El equipo de Horus</p>
  </div>
</body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const emailService = {
  sendEmail,
  renderPasswordResetEmail,
};
