const { getDb } = require("../config/firebase");

async function getPricing(req, res) {
  try {
    const db = getDb();
    const snapshot = await db.collection("pricing").orderBy("createdAt", "asc").get();
    const items = [];
    snapshot.forEach((doc) => { items.push({ id: doc.id, ...doc.data() }); });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch pricing" });
  }
}

async function createPricing(req, res) {
  const { name, price, description, features, featured, visible } = req.body || {};
  if (!name) return res.status(400).json({ error: "Package name is required" });

  try {
    const db = getDb();
    const docRef = await db.collection("pricing").add({
      name: String(name).trim(),
      price: Number(price) || 0,
      description: String(description || "").trim(),
      features: Array.isArray(features) ? features : (typeof features === "string" ? features.split(",").map((s) => s.trim()).filter(Boolean) : []),
      featured: Boolean(featured),
      visible: visible !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const doc = await docRef.get();
    return res.status(201).json({ success: true, data: { id: docRef.id, ...doc.data() } });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create pricing" });
  }
}

async function updatePricing(req, res) {
  const { id } = req.params;
  const { name, price, description, features, featured, visible } = req.body || {};
  if (!id) return res.status(400).json({ error: "Pricing ID is required" });

  try {
    const db = getDb();
    const docRef = db.collection("pricing").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Pricing not found" });
    const updateData = {
      ...(name !== undefined && { name: String(name).trim() }),
      ...(price !== undefined && { price: Number(price) || 0 }),
      ...(description !== undefined && { description: String(description).trim() }),
      ...(features !== undefined && { features: Array.isArray(features) ? features : (typeof features === "string" ? features.split(",").map((s) => s.trim()).filter(Boolean) : []) }),
      ...(featured !== undefined && { featured: Boolean(featured) }),
      ...(visible !== undefined && { visible: Boolean(visible) }),
      updatedAt: new Date().toISOString(),
    };
    await docRef.update(updateData);
    const updated = await docRef.get();
    return res.status(200).json({ success: true, data: { id: updated.id, ...updated.data() } });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update pricing" });
  }
}

async function deletePricing(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Pricing ID is required" });

  try {
    const db = getDb();
    const docRef = db.collection("pricing").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Pricing not found" });
    await docRef.delete();
    return res.status(200).json({ success: true, message: "Pricing deleted" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete pricing" });
  }
}

module.exports = { getPricing, createPricing, updatePricing, deletePricing };
