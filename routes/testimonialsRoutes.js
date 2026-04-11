const express = require("express");
const c = require("../controllers/testimonialsController");
const requireAuth = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/list", c.getTestimonials);
router.post("/add", requireAuth, c.createTestimonial);
router.put("/edit/:id", requireAuth, c.updateTestimonial);
router.delete("/remove/:id", requireAuth, c.deleteTestimonial);

module.exports = router;
