const { getDb } = require("../config/firebase");

async function getExperiences(req, res) {
  try {
    const db = getDb();
    const snapshot = await db.collection("experiences").orderBy("createdAt", "asc").get();
    const items = [];
    snapshot.forEach((doc) => { items.push({ id: doc.id, ...doc.data() }); });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("[Experience] Error fetching:", err?.message || err);
    return res.status(500).json({ error: "Failed to fetch experiences" });
  }
}

async function createExperience(req, res) {
  const { role, company, period, description, tech } = req.body || {};
  if (!role || !company) return res.status(400).json({ error: "Role and company are required" });

  try {
    const db = getDb();
    const docRef = await db.collection("experiences").add({
      role: String(role).trim(),
      company: String(company).trim(),
      period: period || "",
      description: String(description || "").trim(),
      tech: Array.isArray(tech) ? tech : (typeof tech === "string" ? tech.split(",").map((s) => s.trim()).filter(Boolean) : []),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const doc = await docRef.get();
    return res.status(201).json({ success: true, data: { id: docRef.id, ...doc.data() } });
  } catch (err) {
    console.error("[Experience] Error creating:", err?.message || err);
    return res.status(500).json({ error: "Failed to create experience" });
  }
}

async function updateExperience(req, res) {
  const { id } = req.params;
  const { role, company, period, description, tech } = req.body || {};
  if (!id) return res.status(400).json({ error: "Experience ID is required" });

  try {
    const db = getDb();
    const docRef = db.collection("experiences").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Experience not found" });
    const updateData = {
      ...(role !== undefined && { role: String(role).trim() }),
      ...(company !== undefined && { company: String(company).trim() }),
      ...(period !== undefined && { period }),
      ...(description !== undefined && { description: String(description).trim() }),
      ...(tech !== undefined && { tech: Array.isArray(tech) ? tech : (typeof tech === "string" ? tech.split(",").map((s) => s.trim()).filter(Boolean) : []) }),
      updatedAt: new Date().toISOString(),
    };
    await docRef.update(updateData);
    const updated = await docRef.get();
    return res.status(200).json({ success: true, data: { id: updated.id, ...updated.data() } });
  } catch (err) {
    console.error("[Experience] Error updating:", err?.message || err);
    return res.status(500).json({ error: "Failed to update experience" });
  }
}

async function deleteExperience(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Experience ID is required" });

  try {
    const db = getDb();
    const docRef = db.collection("experiences").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Experience not found" });
    await docRef.delete();
    return res.status(200).json({ success: true, message: "Experience deleted" });
  } catch (err) {
    console.error("[Experience] Error deleting:", err?.message || err);
    return res.status(500).json({ error: "Failed to delete experience" });
  }
}

module.exports = { getExperiences, createExperience, updateExperience, deleteExperience };
