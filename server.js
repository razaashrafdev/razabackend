/**
 * Express server
 *
 * Endpoints:
 * - POST /api/auth/request-otp
 * - POST /api/auth/verify-otp
 * - GET  /api/auth/me
 *
 * - GET    /api/projects/list
 * - POST   /api/projects/add
 * - PUT    /api/projects/edit/:id
 * - DELETE /api/projects/remove/:id
 *
 * - GET    /api/services/list
 * - POST   /api/services/add
 * - PUT    /api/services/edit/:id
 * - DELETE /api/services/remove/:id
 *
 * - GET    /api/experiences/list
 * - POST   /api/experiences/add
 * - PUT    /api/experiences/edit/:id
 * - DELETE /api/experiences/remove/:id
 *
 * - GET    /api/pricing/list
 * - POST   /api/pricing/add
 * - PUT    /api/pricing/edit/:id
 * - DELETE /api/pricing/remove/:id
 *
 * - GET    /api/education/list
 * - POST   /api/education/add
 * - PUT    /api/education/edit/:id
 * - DELETE /api/education/remove/:id
 *
 * - GET    /api/testimonials/list
 * - POST   /api/testimonials/add
 * - PUT    /api/testimonials/edit/:id
 * - DELETE /api/testimonials/remove/:id
 *
 * - POST   /api/contact/submit
 * - GET    /api/contact/list
 * - DELETE /api/contact/remove/:id
 *
 * Auth is performed via OTP + JWT.
 */

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const projectsRoutes = require("./routes/projectsRoutes");
const servicesRoutes = require("./routes/servicesRoutes");
const experiencesRoutes = require("./routes/experiencesRoutes");
const pricingRoutes = require("./routes/pricingRoutes");
const educationRoutes = require("./routes/educationRoutes");
const testimonialsRoutes = require("./routes/testimonialsRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.FRONTEND_URL || "";
const allowedOrigins = FRONTEND_ORIGIN.split(",")
  .map((s) => s.trim().replace(/^["']|["']$/g, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (process.env.NODE_ENV !== "production") {
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
          return callback(null, true);
        }
      }
      return callback(null, false);
    },
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/experiences", experiencesRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/testimonials", testimonialsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/contact", contactRoutes);

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
