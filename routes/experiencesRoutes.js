const express = require("express");
const c = require("../controllers/experiencesController");
const requireAuth = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/list", c.getExperiences);
router.post("/add", requireAuth, c.createExperience);
router.put("/edit/:id", requireAuth, c.updateExperience);
router.delete("/remove/:id", requireAuth, c.deleteExperience);

module.exports = router;
