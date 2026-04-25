const { getDb } = require("../config/firebase");

const MIN_NAME = 2;
const MAX_NAME = 30;
const MAX_SUBJECT = 300;
const MIN_MESSAGE = 10;
const MAX_MESSAGE = 1000;

function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** Public: save a contact form submission */
async function submitContact(req, res) {
  const { name, email, subject, message, website } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required" });
  }

  const nameT = String(name).trim();
  const emailT = String(email).trim().toLowerCase();
  const subjectT = subject != null ? String(subject).trim() : "";
  const messageT = String(message).trim();
  const websiteT = website != null ? String(website).trim() : "";

  // Honeypot: bots filling hidden fields are accepted silently and ignored.
  if (websiteT) {
    return res.status(200).json({ success: true });
  }

  if (nameT.length < MIN_NAME || nameT.length > MAX_NAME) {
    return res.status(400).json({ error: "Invalid name" });
  }
  if (!isValidEmail(emailT)) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  if (subjectT.length > MAX_SUBJECT) {
    return res.status(400).json({ error: "Subject is too long" });
  }
  if (messageT.length < MIN_MESSAGE || messageT.length > MAX_MESSAGE) {
    return res.status(400).json({ error: "Message is missing or too long" });
  }

  try {
    const db = getDb();
    const docRef = await db.collection("contactMessages").add({
      name: nameT,
      email: emailT,
      subject: subjectT,
      message: messageT,
      createdAt: new Date().toISOString(),
    });
    const doc = await docRef.get();
    return res.status(201).json({ success: true, data: { id: docRef.id, ...doc.data() } });
  } catch (err) {
    return res.status(500).json({ error: "Failed to send message" });
  }
}

/** Authenticated: list submissions (newest first) */
async function listContactMessages(req, res) {
  try {
    const db = getDb();
    const snapshot = await db.collection("contactMessages").get();
    const items = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    items.sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
}

/** Authenticated: delete a submission */
async function deleteContactMessage(req, res) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Message ID is required" });
  }

  try {
    const db = getDb();
    const docRef = db.collection("contactMessages").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Message not found" });
    }
    await docRef.delete();
    return res.status(200).json({ success: true, message: "Message deleted" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete message" });
  }
}

module.exports = {
  submitContact,
  listContactMessages,
  deleteContactMessage,
};
