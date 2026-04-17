const express = require("express");
const { recordVisit, getStats } = require("../controllers/analyticsController");

const router = express.Router();

router.post("/visit", recordVisit);
router.get("/stats", getStats);

module.exports = router;
