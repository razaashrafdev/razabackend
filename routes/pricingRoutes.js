const express = require("express");
const c = require("../controllers/pricingController");
const requireAuth = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/list", c.getPricing);
router.post("/add", requireAuth, c.createPricing);
router.put("/edit/:id", requireAuth, c.updatePricing);
router.delete("/remove/:id", requireAuth, c.deletePricing);

module.exports = router;
