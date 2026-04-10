const express = require("express");
const projectsController = require("../controllers/projectsController");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", projectsController.getProjects);
router.post("/", requireAuth, projectsController.createProject);
router.put("/:id", requireAuth, projectsController.updateProject);
router.delete("/:id", requireAuth, projectsController.deleteProject);

module.exports = router;
