/**
 * Email sender for OTP codes.
 *
 * Uses SMTP via nodemailer.
 * - In local/dev, if SMTP env vars are not configured, we fall back to console logging the OTP.
 */

let nodemailerLib;
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  nodemailerLib = require("nodemailer");
} catch (_e) {
  nodemailerLib = null;
}

async function sendOtpEmail({ toEmail, otpCode }) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.OTP_FROM_EMAIL;

  // Local fallback: if SMTP isn't configured, log OTP.
  if (!nodemailerLib || !smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromEmail) {
    // eslint-disable-next-line no-console
    console.log(`[OTP DEV] To: ${toEmail} | Code: ${otpCode}`);
    return { delivered: false, via: "console-log" };
  }

  const transporter = nodemailerLib.createTransport({
    host: smtpHost,
    port: Number(smtpPort),
    secure: Number(smtpPort) === 465, // common convention
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const info = await transporter.sendMail({
    from: fromEmail,
    to: toEmail,
    subject: "Your Portfolio Login OTP",
    text: `Your login code is: ${otpCode}\n\nThis code expires in 60 seconds.`,
  });

  return { delivered: true, via: "smtp", messageId: info?.messageId };
}

module.exports = {
  sendOtpEmail,
};

