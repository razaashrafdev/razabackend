/**
 * Email sender for OTP codes.
 *
 * Uses SMTP via nodemailer.
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
  const isProduction = process.env.NODE_ENV === "production";

  if (!nodemailerLib) {
    const err = new Error("Email transport is not available");
    err.statusCode = 500;
    throw err;
  }

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromEmail) {
    const err = new Error(
      isProduction
        ? "Email service is unavailable"
        : "SMTP is not configured"
    );
    err.statusCode = isProduction ? 503 : 500;
    throw err;
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

