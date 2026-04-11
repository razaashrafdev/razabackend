const express = require("express");
const projectsController = require("../controllers/projectsController");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/list", projectsController.getProjects);
router.post("/add", requireAuth, projectsController.createProject);
router.put("/edit/:id", requireAuth, projectsController.updateProject);
router.delete("/remove/:id", requireAuth, projectsController.deleteProject);

module.exports = router;
