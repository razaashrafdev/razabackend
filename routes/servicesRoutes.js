const express = require("express");
const servicesController = require("../controllers/servicesController");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/list", servicesController.getServices);
router.post("/add", requireAuth, servicesController.createService);
router.put("/edit/:id", requireAuth, servicesController.updateService);
router.delete("/remove/:id", requireAuth, servicesController.deleteService);

module.exports = router;
