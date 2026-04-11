const { getDb } = require("../config/firebase");

async function getServices(req, res) {
  try {
    const db = getDb();
    const snapshot = await db.collection("services").orderBy("createdAt", "asc").get();
    const services = [];
    snapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() });
    });
    return res.status(200).json({ success: true, data: services });
  } catch (err) {
    console.error("[Services] Error fetching:", err?.message || err);
    return res.status(500).json({ error: "Failed to fetch services" });
  }
}

async function createService(req, res) {
  const { title, description, icon } = req.body || {};

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required" });
  }

  try {
    const db = getDb();
    const docRef = await db.collection("services").add({
      title: String(title).trim(),
      description: String(description).trim(),
      icon: icon || "Code",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const doc = await docRef.get();
    return res.status(201).json({ success: true, data: { id: docRef.id, ...doc.data() } });
  } catch (err) {
    console.error("[Services] Error creating:", err?.message || err);
    return res.status(500).json({ error: "Failed to create service" });
  }
}

async function updateService(req, res) {
  const { id } = req.params;
  const { title, description, icon } = req.body || {};

  if (!id) {
    return res.status(400).json({ error: "Service ID is required" });
  }

  try {
    const db = getDb();
    const docRef = db.collection("services").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Service not found" });
    }
    const updateData = {
      ...(title !== undefined && { title: String(title).trim() }),
      ...(description !== undefined && { description: String(description).trim() }),
      ...(icon !== undefined && { icon: icon || "Code" }),
      updatedAt: new Date().toISOString(),
    };
    await docRef.update(updateData);
    const updated = await docRef.get();
    return res.status(200).json({ success: true, data: { id: updated.id, ...updated.data() } });
  } catch (err) {
    console.error("[Services] Error updating:", err?.message || err);
    return res.status(500).json({ error: "Failed to update service" });
  }
}

async function deleteService(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Service ID is required" });
  }

  try {
    const db = getDb();
    const docRef = db.collection("services").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Service not found" });
    }
    await docRef.delete();
    return res.status(200).json({ success: true, message: "Service deleted" });
  } catch (err) {
    console.error("[Services] Error deleting:", err?.message || err);
    return res.status(500).json({ error: "Failed to delete service" });
  }
}

module.exports = {
  getServices,
  createService,
  updateService,
  deleteService,
};
