const { getDb } = require("../config/firebase");

const MAX_HOME_PROJECTS = 3;
const HOME_LIMIT_ERROR =
  "first remove one project from home to show this project in home page";

function isShownOnHome(data) {
  return data.showOnHome !== false;
}

async function countProjectsShownOnHome(db, excludeId) {
  const snapshot = await db.collection("projects").get();
  let n = 0;
  snapshot.forEach((doc) => {
    if (excludeId && doc.id === excludeId) return;
    if (isShownOnHome(doc.data())) n += 1;
  });
  return n;
}

async function getProjects(req, res) {
  try {
    const db = getDb();
    const snapshot = await db.collection("projects").get();
    const projects = [];
    snapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() });
    });
    projects.sort((a, b) => {
      const ta = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const tb = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return tb - ta;
    });
    return res.status(200).json({ success: true, data: projects });
  } catch (err) {
    console.error("[Projects] Error fetching:", err?.message || err);
    return res.status(500).json({ error: "Failed to fetch projects" });
  }
}

async function createProject(req, res) {
  const { title, description, tech, link, github, showOnHome } = req.body || {};

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required" });
  }

  try {
    const db = getDb();
    const home = Boolean(showOnHome);
    if (home) {
      const onHome = await countProjectsShownOnHome(db, null);
      if (onHome >= MAX_HOME_PROJECTS) {
        return res.status(400).json({ error: HOME_LIMIT_ERROR });
      }
    }
    const docRef = await db.collection("projects").add({
      title: String(title).trim(),
      description: String(description).trim(),
      tech: Array.isArray(tech) ? tech : (typeof tech === "string" ? tech.split(",").map((s) => s.trim()).filter(Boolean) : []),
      link: link || "",
      github: github || "",
      showOnHome: home,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const doc = await docRef.get();
    return res.status(201).json({ success: true, data: { id: docRef.id, ...doc.data() } });
  } catch (err) {
    console.error("[Projects] Error creating:", err?.message || err);
    return res.status(500).json({ error: "Failed to create project" });
  }
}

async function updateProject(req, res) {
  const { id } = req.params;
  const { title, description, tech, link, github, showOnHome } = req.body || {};

  if (!id) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  try {
    const db = getDb();
    const docRef = db.collection("projects").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }
    const prev = doc.data();
    if (showOnHome !== undefined) {
      const nextHome = Boolean(showOnHome);
      const wasOnHome = isShownOnHome(prev);
      if (nextHome && !wasOnHome) {
        const onHome = await countProjectsShownOnHome(db, id);
        if (onHome >= MAX_HOME_PROJECTS) {
          return res.status(400).json({ error: HOME_LIMIT_ERROR });
        }
      }
    }
    const updateData = {
      ...(title !== undefined && { title: String(title).trim() }),
      ...(description !== undefined && { description: String(description).trim() }),
      ...(tech !== undefined && { tech: Array.isArray(tech) ? tech : (typeof tech === "string" ? tech.split(",").map((s) => s.trim()).filter(Boolean) : []) }),
      ...(link !== undefined && { link: link || "" }),
      ...(github !== undefined && { github: github || "" }),
      ...(showOnHome !== undefined && { showOnHome: Boolean(showOnHome) }),
      updatedAt: new Date().toISOString(),
    };
    await docRef.update(updateData);
    const updated = await docRef.get();
    return res.status(200).json({ success: true, data: { id: updated.id, ...updated.data() } });
  } catch (err) {
    console.error("[Projects] Error updating:", err?.message || err);
    return res.status(500).json({ error: "Failed to update project" });
  }
}

async function deleteProject(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  try {
    const db = getDb();
    const docRef = db.collection("projects").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Project not found" });
    }
    await docRef.delete();
    return res.status(200).json({ success: true, message: "Project deleted" });
  } catch (err) {
    console.error("[Projects] Error deleting:", err?.message || err);
    return res.status(500).json({ error: "Failed to delete project" });
  }
}

module.exports = {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
};
