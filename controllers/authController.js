const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { sendOtpEmail } = require("../config/email");

// In-memory OTP store.
// Keyed by lowercased email: { hash, expiresAt }
const otpStore = new Map();

function generateOtpCode() {
  // 6-digit numeric code as string (e.g. "004219")
  return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
}

/**
 * POST /api/auth/request-otp
 *
 * Validates allowed admin email (ADMIN_EMAIL), generates OTP, emails it, and stores hashed OTP for 60 seconds.
 */
async function requestOtp(req, res) {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const jwtSecret = process.env.JWT_SECRET;
  const otpTtlSeconds = Number(process.env.OTP_TTL_SECONDS || 60);

  if (!adminEmail) {
    return res.status(500).json({ error: "ADMIN_EMAIL is not configured" });
  }
  if (!jwtSecret) {
    return res.status(500).json({ error: "JWT_SECRET is not configured" });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedAdminEmail = String(adminEmail).toLowerCase().trim();

  if (normalizedEmail !== normalizedAdminEmail) {
    return res.status(401).json({ error: "Email is wrong" });
  }

  const otpCode = generateOtpCode();
  try {
    await sendOtpEmail({ toEmail: normalizedEmail, otpCode });
  } catch (err) {
    return res
      .status(err?.statusCode || 500)
      .json({ error: err?.message || "Failed to send OTP email" });
  }

  const otpHash = await bcrypt.hash(otpCode, 10);
  const expiresAt = Date.now() + otpTtlSeconds * 1000;
  otpStore.set(normalizedEmail, { hash: otpHash, expiresAt });

  return res.status(200).json({ success: true, expiresIn: otpTtlSeconds });
}

/**
 * POST /api/auth/verify-otp
 *
 * Validates OTP and issues JWT token.
 */
async function verifyOtp(req, res) {
  const { email, code } = req.body || {};

  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1h";

  if (!adminEmail) {
    return res.status(500).json({ error: "ADMIN_EMAIL is not configured" });
  }
  if (!jwtSecret) {
    return res.status(500).json({ error: "JWT_SECRET is not configured" });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedAdminEmail = String(adminEmail).toLowerCase().trim();

  if (normalizedEmail !== normalizedAdminEmail) {
    return res.status(401).json({ error: "Email is wrong" });
  }

  const stored = otpStore.get(normalizedEmail);
  if (!stored) {
    return res.status(401).json({ error: "OTP is invalid or expired" });
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(normalizedEmail);
    return res.status(401).json({ error: "OTP expired" });
  }

  const providedCode = String(code).trim();
  const isValid = await bcrypt.compare(providedCode, stored.hash);
  if (!isValid) {
    return res.status(401).json({ error: "OTP is wrong" });
  }

  // OTP used successfully - delete it.
  otpStore.delete(normalizedEmail);

  const token = jwt.sign(
    { sub: normalizedAdminEmail },
    jwtSecret,
    { expiresIn: jwtExpiresIn },
  );

  return res.status(200).json({
    token,
    tokenType: "Bearer",
    user: { email: normalizedAdminEmail },
  });
}

/**
 * GET /api/auth/me
 */
function me(req, res) {
  return res.status(200).json({ email: req.user?.email || null });
}

module.exports = {
  requestOtp,
  verifyOtp,
  me,
};

