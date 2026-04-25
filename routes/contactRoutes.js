const express = require("express");
const c = require("../controllers/contactMessagesController");
const requireAuth = require("../middleware/authMiddleware");
const { contactRoutesLimiter, contactSubmitLimiter } = require("../middleware/rateLimiters");

const router = express.Router();
router.use(contactRoutesLimiter);

router.post("/submit", contactSubmitLimiter, c.submitContact);
router.get("/list", requireAuth, c.listContactMessages);
router.get("/messages", requireAuth, c.listContactMessages);
router.delete("/remove/:id", requireAuth, c.deleteContactMessage);

module.exports = router;
