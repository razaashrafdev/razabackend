/**
 * Express server
 *
 * Endpoints:
 * - POST /api/auth/request-otp
 * - POST /api/auth/verify-otp
 * - GET  /api/auth/me
 *
 * - GET    /api/projects
 * - POST   /api/projects
 * - PUT    /api/projects/:id
 * - DELETE /api/projects/:id
 *
 * Auth is performed via OTP + JWT.
 */

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const projectsRoutes = require("./routes/projectsRoutes");

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.FRONTEND_URL;
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectsRoutes);

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

const PORT = Number(process.env.PORT || 5000);

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}
