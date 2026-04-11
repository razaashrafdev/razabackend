const { getDb } = require("../config/firebase");

async function getTestimonials(req, res) {
  try {
    const db = getDb();
    const snapshot = await db.collection("testimonials").orderBy("createdAt", "asc").get();
    const items = [];
    snapshot.forEach((doc) => { items.push({ id: doc.id, ...doc.data() }); });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("[Testimonials] Error fetching:", err?.message || err);
    return res.status(500).json({ error: "Failed to fetch testimonials" });
  }
}

async function createTestimonial(req, res) {
  const { quote, name, role, visible } = req.body || {};
  if (!quote || !name) return res.status(400).json({ error: "Quote and name are required" });

  try {
    const db = getDb();
    const docRef = await db.collection("testimonials").add({
      quote: String(quote).trim(),
      name: String(name).trim(),
      role: String(role || "").trim(),
      visible: visible !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const doc = await docRef.get();
    return res.status(201).json({ success: true, data: { id: docRef.id, ...doc.data() } });
  } catch (err) {
    console.error("[Testimonials] Error creating:", err?.message || err);
    return res.status(500).json({ error: "Failed to create testimonial" });
  }
}

async function updateTestimonial(req, res) {
  const { id } = req.params;
  const { quote, name, role, visible } = req.body || {};
  if (!id) return res.status(400).json({ error: "Testimonial ID is required" });

  try {
    const db = getDb();
    const docRef = db.collection("testimonials").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Testimonial not found" });
    const updateData = {
      ...(quote !== undefined && { quote: String(quote).trim() }),
      ...(name !== undefined && { name: String(name).trim() }),
      ...(role !== undefined && { role: String(role).trim() }),
      ...(visible !== undefined && { visible: Boolean(visible) }),
      updatedAt: new Date().toISOString(),
    };
    await docRef.update(updateData);
    const updated = await docRef.get();
    return res.status(200).json({ success: true, data: { id: updated.id, ...updated.data() } });
  } catch (err) {
    console.error("[Testimonials] Error updating:", err?.message || err);
    return res.status(500).json({ error: "Failed to update testimonial" });
  }
}

async function deleteTestimonial(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Testimonial ID is required" });

  try {
    const db = getDb();
    const docRef = db.collection("testimonials").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Testimonial not found" });
    await docRef.delete();
    return res.status(200).json({ success: true, message: "Testimonial deleted" });
  } catch (err) {
    console.error("[Testimonials] Error deleting:", err?.message || err);
    return res.status(500).json({ error: "Failed to delete testimonial" });
  }
}

module.exports = { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial };
