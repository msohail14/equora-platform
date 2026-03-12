const wrapTemplate = ({ title, preheader, body }) => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:24px auto;background:#ffffff;border:1px solid #e6e6e6;border-radius:8px;overflow:hidden;">
      <div style="padding:20px;border-bottom:1px solid #eee;background:#fafafa;">
        <p style="margin:0;color:#666;font-size:12px;">${preheader}</p>
      </div>
      <div style="padding:24px;">${body}</div>
    </div>
  </body>
</html>
`;

export const otpTemplate = ({ name, otp }) =>
  wrapTemplate({
    title: 'Your OTP Code',
    preheader: 'Use this OTP to continue.',
    body: `
      <h2 style="margin:0 0 12px;">Hello ${name || 'User'},</h2>
      <p style="margin:0 0 16px;color:#333;">Your one-time password is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:0 0 16px;">${otp}</p>
      <p style="margin:0;color:#666;">If you did not request this, please ignore this email.</p>
    `,
  });

export const resetTokenTemplate = ({ name, resetToken, expiresMinutes }) =>
  wrapTemplate({
    title: 'Password Reset Token',
    preheader: 'Use this token to reset your password.',
    body: `
      <h2 style="margin:0 0 12px;">Hello ${name || 'User'},</h2>
      <p style="margin:0 0 16px;color:#333;">Use this reset token:</p>
      <p style="font-size:20px;font-weight:700;word-break:break-all;margin:0 0 16px;">${resetToken}</p>
      <p style="margin:0;color:#666;">This token expires in ${expiresMinutes} minutes.</p>
    `,
  });

export const resetLinkTemplate = ({ name, resetLink, expiresMinutes }) =>
  wrapTemplate({
    title: 'Reset Your Password',
    preheader: 'Click the link to reset your password.',
    body: `
      <h2 style="margin:0 0 12px;">Hello ${name || 'User'},</h2>
      <p style="margin:0 0 16px;color:#333;">Click the button below to reset your password.</p>
      <a href="${resetLink}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a>
      <p style="margin:16px 0 0;color:#666;">This link expires in ${expiresMinutes} minutes.</p>
    `,
  });
