const express = require("express");
const c = require("../controllers/educationController");
const requireAuth = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/list", c.getEducation);
router.post("/add", requireAuth, c.createEducation);
router.put("/edit/:id", requireAuth, c.updateEducation);
router.delete("/remove/:id", requireAuth, c.deleteEducation);

module.exports = router;
