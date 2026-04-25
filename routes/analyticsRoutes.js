const express = require("express");
const { recordVisit, getStats } = require("../controllers/analyticsController");
const { analyticsVisitLimiter } = require("../middleware/rateLimiters");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/visit", analyticsVisitLimiter, recordVisit);
router.get("/stats", requireAuth, getStats);

module.exports = router;
