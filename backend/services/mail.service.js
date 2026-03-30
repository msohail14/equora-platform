import { Resend } from 'resend';
import { otpTemplate, resetLinkTemplate, resetTokenTemplate } from '../templates/mail.template.js';

// Try Resend first, fall back to SMTP
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

// Fallback SMTP transport (if Resend not configured)
const getSMTPTransport = async () => {
  try {
    const { createMailerTransport } = await import('../config/mailer.config.js');
    return createMailerTransport();
  } catch {
    return null;
  }
};

const getFromAddress = () =>
  process.env.MAIL_FROM || `Equora <noreply@${process.env.RESEND_DOMAIN || 'equorariding.com'}>`;

export const sendMail = async ({ to, subject, html, text }) => {
  if (!to || !subject || (!html && !text)) {
    throw new Error('to, subject, and html/text are required.');
  }

  // Try Resend first
  const resend = getResendClient();
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: getFromAddress(),
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || undefined,
        text: text || undefined,
      });

      return {
        messageId: result.data?.id || result.id,
        provider: 'resend',
      };
    } catch (e) {
      console.warn('[mail] Resend failed:', e.message);
      // Fall through to SMTP
    }
  }

  // Fallback to SMTP
  const transport = await getSMTPTransport();
  if (!transport) {
    console.warn('[mail] No email provider configured. Set RESEND_API_KEY or SMTP vars.');
    return { messageId: null, provider: 'none', skipped: true };
  }

  const info = await transport.sendMail({
    from: getFromAddress(),
    to,
    subject,
    html,
    text,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    provider: 'smtp',
  };
};

export const sendOtpEmail = async ({ to, otp, name }) => {
  if (!otp) {
    throw new Error('otp is required.');
  }

  return sendMail({
    to,
    subject: 'Your Equora Verification Code',
    html: otpTemplate({ name, otp }),
    text: `Your verification code is: ${otp}`,
  });
};

export const sendResetTokenEmail = async ({ to, resetToken, name, expiresMinutes = 15 }) => {
  if (!resetToken) {
    throw new Error('resetToken is required.');
  }

  return sendMail({
    to,
    subject: 'Equora Password Reset',
    html: resetTokenTemplate({ name, resetToken, expiresMinutes }),
    text: `Your password reset token is: ${resetToken}. It expires in ${expiresMinutes} minutes.`,
  });
};

export const sendResetPasswordLinkEmail = async ({ to, resetLink, name, expiresMinutes = 15 }) => {
  if (!resetLink) {
    throw new Error('resetLink is required.');
  }

  return sendMail({
    to,
    subject: 'Reset Your Equora Password',
    html: resetLinkTemplate({ name, resetLink, expiresMinutes }),
    text: `Reset your password using this link: ${resetLink}. It expires in ${expiresMinutes} minutes.`,
  });
};
