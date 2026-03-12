import { createMailerTransport } from '../config/mailer.config.js';
import { otpTemplate, resetLinkTemplate, resetTokenTemplate } from '../templates/mail.template.js';

const getTransport = () => createMailerTransport();

const getFromAddress = () => process.env.MAIL_FROM;

export const sendMail = async ({ to, subject, html, text }) => {
  if (!to || !subject || (!html && !text)) {
    throw new Error('to, subject, and html/text are required.');
  }

  const transport = getTransport();

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
  };
};

export const sendOtpEmail = async ({ to, otp, name }) => {
  if (!otp) {
    throw new Error('otp is required.');
  }

  return sendMail({
    to,
    subject: 'Your OTP Code',
    html: otpTemplate({ name, otp }),
    text: `Your OTP is: ${otp}`,
  });
};

export const sendResetTokenEmail = async ({ to, resetToken, name, expiresMinutes = 15 }) => {
  if (!resetToken) {
    throw new Error('resetToken is required.');
  }

  return sendMail({
    to,
    subject: 'Password Reset Token',
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
    subject: 'Reset Your Password',
    html: resetLinkTemplate({ name, resetLink, expiresMinutes }),
    text: `Reset your password using this link: ${resetLink}. It expires in ${expiresMinutes} minutes.`,
  });
};
