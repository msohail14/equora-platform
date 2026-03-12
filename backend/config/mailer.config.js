import nodemailer from 'nodemailer';

const requiredMailerEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM'];

export const validateMailerConfig = () => {
  const missing = requiredMailerEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing mail configuration: ${missing.join(', ')}`);
  }
};

export const createMailerTransport = () => {
  validateMailerConfig();

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};
