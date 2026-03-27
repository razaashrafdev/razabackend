/**
 * Express server
 *
 * Endpoints:
 * - POST /api/auth/request-otp
 * - POST /api/auth/verify-otp
 * - GET  /api/auth/me
 *
 * Auth is performed via OTP + JWT.
 */

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();

// Allow frontend to call this API. Keep it restricted to your frontend origin.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.FRONTEND_URL;
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
  })
);

app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);

// Health check endpoint (optional, but helpful for debugging)
app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

// Basic 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

const PORT = Number(process.env.PORT || 5000);

// Export app for serverless deployments (e.g. Vercel).
module.exports = app;

// Start local server only when this file is run directly (not imported by Vercel runtime).
if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

