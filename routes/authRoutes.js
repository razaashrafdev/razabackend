const express = require("express");
const authController = require("../controllers/authController");
const requireAuth = require("../middleware/authMiddleware");
const { authRoutesLimiter, requestOtpLimiter, verifyOtpLimiter } = require("../middleware/rateLimiters");

const router = express.Router();
router.use(authRoutesLimiter);

/**
 * POST /api/auth/request-otp
 *
 * Purpose:
 * - Validates allowed admin email against ADMIN_EMAIL
 * - Generates a 6-digit OTP and emails it to user (via SMTP)
 * - OTP is valid for 60 seconds
 *
 * Request JSON:
 * { "email": "admin@example.com" }
 *
 * Success Response (200):
 * { "success": true, "expiresIn": 60 }
 *
 * Error Responses:
 * 400 - missing email
 * 401 - email is wrong / not allowed
 */
router.post("/request-otp", requestOtpLimiter, authController.requestOtp);

/**
 * POST /api/auth/verify-otp
 *
 * Purpose:
 * - Verifies provided OTP for email within expiry window
 * - If correct, issues JWT token
 *
 * Request JSON:
 * { "email": "admin@example.com", "code": "123456" }
 *
 * Success Response (200):
 * {
 *   "token": "<jwt>",
 *   "tokenType": "Bearer",
 *   "user": { "email": "admin@example.com" }
 * }
 *
 * Error Responses:
 * 400 - missing email/code
 * 401 - invalid/expired code
 */
router.post("/verify-otp", verifyOtpLimiter, authController.verifyOtp);

/**
 * GET /api/auth/me
 * - Returns authenticated user email using JWT
 */
router.get("/me", requireAuth, authController.me);

module.exports = router;

