const express = require("express");
const c = require("../controllers/contactMessagesController");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/submit", c.submitContact);
router.get("/list", requireAuth, c.listContactMessages);
router.delete("/remove/:id", requireAuth, c.deleteContactMessage);

module.exports = router;
