const { getDb } = require("../config/firebase");

async function getEducation(req, res) {
  try {
    const db = getDb();
    const snapshot = await db.collection("education").orderBy("createdAt", "asc").get();
    const items = [];
    snapshot.forEach((doc) => { items.push({ id: doc.id, ...doc.data() }); });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("[Education] Error fetching:", err?.message || err);
    return res.status(500).json({ error: "Failed to fetch education" });
  }
}

async function createEducation(req, res) {
  const { title, org, year, description, type, visible } = req.body || {};
  if (!title || !org) return res.status(400).json({ error: "Title and organization are required" });

  try {
    const db = getDb();
    const docRef = await db.collection("education").add({
      title: String(title).trim(),
      org: String(org).trim(),
      year: year || "",
      description: String(description || "").trim(),
      type: type === "certification" ? "certification" : "degree",
      visible: visible !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const doc = await docRef.get();
    return res.status(201).json({ success: true, data: { id: docRef.id, ...doc.data() } });
  } catch (err) {
    console.error("[Education] Error creating:", err?.message || err);
    return res.status(500).json({ error: "Failed to create education" });
  }
}

async function updateEducation(req, res) {
  const { id } = req.params;
  const { title, org, year, description, type, visible } = req.body || {};
  if (!id) return res.status(400).json({ error: "Education ID is required" });

  try {
    const db = getDb();
    const docRef = db.collection("education").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Education not found" });
    const updateData = {
      ...(title !== undefined && { title: String(title).trim() }),
      ...(org !== undefined && { org: String(org).trim() }),
      ...(year !== undefined && { year }),
      ...(description !== undefined && { description: String(description).trim() }),
      ...(type !== undefined && { type: type === "certification" ? "certification" : "degree" }),
      ...(visible !== undefined && { visible: Boolean(visible) }),
      updatedAt: new Date().toISOString(),
    };
    await docRef.update(updateData);
    const updated = await docRef.get();
    return res.status(200).json({ success: true, data: { id: updated.id, ...updated.data() } });
  } catch (err) {
    console.error("[Education] Error updating:", err?.message || err);
    return res.status(500).json({ error: "Failed to update education" });
  }
}

async function deleteEducation(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Education ID is required" });

  try {
    const db = getDb();
    const docRef = db.collection("education").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Education not found" });
    await docRef.delete();
    return res.status(200).json({ success: true, message: "Education deleted" });
  } catch (err) {
    console.error("[Education] Error deleting:", err?.message || err);
    return res.status(500).json({ error: "Failed to delete education" });
  }
}

module.exports = { getEducation, createEducation, updateEducation, deleteEducation };
