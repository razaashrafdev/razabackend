const express = require("express");
const { getStats, updateStats } = require("../controllers/statsController");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getStats);
router.put("/", requireAuth, updateStats);

module.exports = router;
