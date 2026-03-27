const jwt = require("jsonwebtoken");

/**
 * Middleware: requireAuth
 *
 * Reads JWT from header:
 * Authorization: Bearer <token>
 *
 * On success:
 * - Attaches `req.user = { email }`
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({ error: "JWT_SECRET is not configured" });
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, jwtSecret);
    // We store email in `sub` when signing the token.
    req.user = { email: payload.sub || payload.email };
    return next();
  } catch (_err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = requireAuth;

