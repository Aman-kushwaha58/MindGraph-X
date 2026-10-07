/**
 * MindGraph X: Unified Email Delivery Pipeline
 * Implements SMTP (Nodemailer), Transactional API (Resend / SendGrid),
 * and Development Fallback with secure password reset delivery.
 */

import nodemailer, { type Transporter } from 'nodemailer';

export interface SendPasswordResetOptions {
  to: string;
  resetUrl: string;
  name?: string;
  expiresInMinutes?: number;
}

export interface SendEmailResult {
  success: boolean;
  provider: 'smtp' | 'resend' | 'sendgrid' | 'dev';
  messageId: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private provider: 'smtp' | 'resend' | 'sendgrid' | 'dev' = 'dev';

  constructor() {
    this.initProvider();
  }

  public initProvider() {
    const explicitProvider = process.env.EMAIL_PROVIDER?.toLowerCase();

    if (explicitProvider === 'smtp' || process.env.SMTP_HOST) {
      this.provider = 'smtp';
      const port = parseInt(process.env.SMTP_PORT || '587', 10);
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      });
    } else if (explicitProvider === 'resend' || process.env.RESEND_API_KEY) {
      this.provider = 'resend';
    } else if (explicitProvider === 'sendgrid' || process.env.SENDGRID_API_KEY) {
      this.provider = 'sendgrid';
    } else {
      this.provider = 'dev';
    }
  }

  public async verifyConfig(): Promise<{ ok: boolean; provider: string; warning?: string }> {
    if (this.provider === 'smtp') {
      if (!this.transporter) {
        return { ok: false, provider: 'smtp', warning: 'Transporter failed to initialize.' };
      }
      return { ok: true, provider: 'smtp' };
    }
    return { ok: true, provider: this.provider };
  }

  /**
   * Dispatches a raw email across configured providers
   */
  public async sendEmail(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
    logContext?: string;
  }): Promise<SendEmailResult> {
    const { to, subject, text, html, logContext } = options;
    const fromAddress =
      process.env.EMAIL_FROM ||
      (process.env.SMTP_USER ? `MindGraph X <${process.env.SMTP_USER}>` : 'MindGraph X <auth@mindgraph.ai>');

    // 1. SMTP Transport
    if (this.provider === 'smtp') {
      if (!this.transporter) this.initProvider();
      if (!this.transporter) throw new Error('SMTP transporter is not initialized.');

      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          text,
          html,
          headers: {
            'X-Entity-Ref-ID': `mindgraph-reset-${Date.now()}`,
          },
        });
        console.log(`[EmailService] ✅ Email delivered via SMTP to ${to}. MessageID: ${info.messageId}`);
        return { success: true, provider: 'smtp', messageId: info.messageId };
      } catch (err: any) {
        console.error(`[EmailService] ❌ SMTP send failed:`, err.message || err);
        throw new Error(`SMTP send failed: ${err.message || err}`);
      }
    }

    // 2. Resend Transport
    if (this.provider === 'resend') {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) throw new Error('Resend API key missing.');

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ from: fromAddress, to: [to], subject, html, text }),
        });
        if (!response.ok) {
          const body = await response.text();
          throw new Error(`Resend error (${response.status}): ${body}`);
        }
        const data: any = await response.json();
        return { success: true, provider: 'resend', messageId: data.id || `resend-${Date.now()}` };
      } catch (err: any) {
        console.error(`[EmailService] ❌ Resend send failed:`, err.message || err);
        throw new Error(`Resend send failed: ${err.message || err}`);
      }
    }

    // 3. SendGrid Transport
    if (this.provider === 'sendgrid') {
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) throw new Error('SendGrid API key missing.');

      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: fromAddress },
            subject,
            content: [
              { type: 'text/plain', value: text },
              { type: 'text/html', value: html },
            ],
          }),
        });
        if (!response.ok) {
          const body = await response.text();
          throw new Error(`SendGrid error (${response.status}): ${body}`);
        }
        return { success: true, provider: 'sendgrid', messageId: `sendgrid-${Date.now()}` };
      } catch (err: any) {
        console.error(`[EmailService] ❌ SendGrid send failed:`, err.message || err);
        throw new Error(`SendGrid send failed: ${err.message || err}`);
      }
    }

    // 4. Dev / Console Fallback
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║ [DEV CONSOLE LOG] Email Dispatch Notification                              ║
║ To:        ${to.padEnd(59)} ║
║ Subject:   ${subject.slice(0, 59).padEnd(59)} ║
║ Context:   ${(logContext || 'N/A').slice(0, 59).padEnd(59)} ║
╚════════════════════════════════════════════════════════════════════════════╝`);

    return {
      success: true,
      provider: 'dev',
      messageId: `dev-msg-${Date.now()}`,
    };
  }

  /**
   * Dispatches branded password reset email with secure one-time link
   */
  public async sendPasswordResetEmail(options: SendPasswordResetOptions): Promise<SendEmailResult> {
    const { to, resetUrl, name, expiresInMinutes = 15 } = options;
    const recipientName = name || to.split('@')[0];
    const subject = 'Reset your MindGraph X password';

    const text = `Hello ${recipientName},\n\nA request to reset your MindGraph X password was received.\n\nClick the link below or paste it into your browser (expires in ${expiresInMinutes} minutes):\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.\n\n— MindGraph X Team`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 500px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <h1 style="color: #a855f7; font-size: 22px; font-weight: 800; margin: 0;">MindGraph X</h1>
              <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0 0;">Zero-Hallucination Intelligence</p>
            </td>
          </tr>
          <tr>
            <td style="color: #cbd5e1; font-size: 14px; line-height: 22px;">
              <p style="margin: 0 0 16px 0;">Hello <strong>${recipientName}</strong>,</p>
              <p style="margin: 0 0 24px 0;">We received a request to reset your password. Click the button below to update your password:</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #9333ea, #4f46e5); color: #ffffff; padding: 14px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 12px; display: inline-block;">Reset Password &rarr;</a>
            </td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 12px; line-height: 18px; border-top: 1px solid #1e293b; padding-top: 20px;">
              <p style="margin: 0 0 8px 0;">This link is valid for <strong>${expiresInMinutes} minutes</strong> and can only be used once.</p>
              <p style="margin: 0;">If you didn't request a password reset, no further action is required.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return this.sendEmail({
      to,
      subject,
      text,
      html,
      logContext: `Reset Link: ${resetUrl}`,
    });
  }
}

export const emailService = new EmailService();
