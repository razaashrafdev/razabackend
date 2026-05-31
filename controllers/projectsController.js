const { getDb } = require("../config/firebase");

const MAX_HOME_PROJECTS = 3;
const HOME_LIMIT_ERROR =
  "first remove one project from home to show this project in home page";

function isShownOnHome(data) {
  return data.showOnHome !== false;
}

function sortProjects(projects) {
  projects.sort((a, b) => {
    const pa = a.position ?? Number.MAX_SAFE_INTEGER;
    const pb = b.position ?? Number.MAX_SAFE_INTEGER;
    if (pa !== pb) return pa - pb;
    const ta = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const tb = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return tb - ta;
  });
}

async function fetchAllProjects(db) {
  const snapshot = await db.collection("projects").get();
  const projects = [];
  snapshot.forEach((doc) => {
    projects.push({ id: doc.id, ...doc.data() });
  });
  return projects;
}

async function ensurePositions(db, projects) {
  const needsBackfill = projects.some((p) => p.position == null || p.position === undefined);
  if (!needsBackfill) {
    sortProjects(projects);
    return projects;
  }

  const sorted = [...projects].sort((a, b) => {
    const ta = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const tb = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return tb - ta;
  });

  const batch = db.batch();
  sorted.forEach((p, i) => {
    const pos = i + 1;
    p.position = pos;
    batch.update(db.collection("projects").doc(p.id), { position: pos });
  });
  await batch.commit();
  sortProjects(sorted);
  return sorted;
}

async function compactPositions(db) {
  const projects = await fetchAllProjects(db);
  sortProjects(projects);
  const batch = db.batch();
  let changed = false;
  projects.forEach((p, i) => {
    const pos = i + 1;
    if (p.position !== pos) {
      changed = true;
      batch.update(db.collection("projects").doc(p.id), { position: pos });
      p.position = pos;
    }
  });
  if (changed) await batch.commit();
  sortProjects(projects);
  return projects;
}

async function applyPositionChange(db, id, newPosition) {
  let projects = await fetchAllProjects(db);
  projects = await ensurePositions(db, projects);

  const current = projects.find((p) => p.id === id);
  if (!current) return null;

  const oldPosition = current.position;
  const maxPosition = projects.length;
  const targetPosition = Math.min(Math.max(Math.trunc(newPosition), 1), maxPosition);

  if (targetPosition === oldPosition) {
    sortProjects(projects);
    return projects;
  }

  const batch = db.batch();
  for (const p of projects) {
    if (p.id === id) continue;
    let nextPosition = p.position;
    if (oldPosition < targetPosition) {
      if (p.position > oldPosition && p.position <= targetPosition) {
        nextPosition = p.position - 1;
      }
    } else if (oldPosition > targetPosition) {
      if (p.position >= targetPosition && p.position < oldPosition) {
        nextPosition = p.position + 1;
      }
    }
    if (nextPosition !== p.position) {
      batch.update(db.collection("projects").doc(p.id), { position: nextPosition });
      p.position = nextPosition;
    }
  }
  batch.update(db.collection("projects").doc(id), { position: targetPosition });
  current.position = targetPosition;
  await batch.commit();
  sortProjects(projects);
  return projects;
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

function toPublicProjects(projects) {
  return projects.map(({ id, title, description, tech, link, github, showOnHome, position, createdAt, updatedAt }) => ({
    id,
    title,
    description,
    tech,
    link,
    github,
    showOnHome,
    position,
    createdAt,
    updatedAt,
  }));
}

async function getProjects(req, res) {
  try {
    const db = getDb();
    let projects = await fetchAllProjects(db);
    projects = await ensurePositions(db, projects);
    return res.status(200).json({ success: true, data: toPublicProjects(projects) });
  } catch (err) {
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

    let projects = await fetchAllProjects(db);
    projects = await ensurePositions(db, projects);

    const now = new Date().toISOString();
    const newRef = db.collection("projects").doc();
    const batch = db.batch();

    projects.forEach((p) => {
      batch.update(db.collection("projects").doc(p.id), { position: p.position + 1 });
    });

    batch.set(newRef, {
      title: String(title).trim(),
      description: String(description).trim(),
      tech: Array.isArray(tech) ? tech : (typeof tech === "string" ? tech.split(",").map((s) => s.trim()).filter(Boolean) : []),
      link: link || "",
      github: github || "",
      showOnHome: home,
      position: 1,
      createdAt: now,
      updatedAt: now,
    });

    await batch.commit();
    const doc = await newRef.get();
    const allProjects = await compactPositions(db);
    return res.status(201).json({
      success: true,
      data: { id: newRef.id, ...doc.data() },
      projects: toPublicProjects(allProjects),
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create project" });
  }
}

async function updateProject(req, res) {
  const { id } = req.params;
  const { title, description, tech, link, github, showOnHome, position } = req.body || {};

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

    if (position !== undefined) {
      const parsed = Number(position);
      if (!Number.isFinite(parsed) || parsed < 1) {
        return res.status(400).json({ error: "Position must be a positive integer" });
      }
      const reordered = await applyPositionChange(db, id, parsed);
      if (!reordered) {
        return res.status(404).json({ error: "Project not found" });
      }
    }

    if (Object.keys(updateData).length > 1) {
      await docRef.update(updateData);
    }

    const updated = await docRef.get();
    const response = {
      success: true,
      data: { id: updated.id, ...updated.data() },
    };

    if (position !== undefined) {
      let projects = await fetchAllProjects(db);
      projects = await ensurePositions(db, projects);
      response.projects = toPublicProjects(projects);
    }

    return res.status(200).json(response);
  } catch (err) {
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
    const projects = await compactPositions(db);
    return res.status(200).json({
      success: true,
      message: "Project deleted",
      projects: toPublicProjects(projects),
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete project" });
  }
}

module.exports = {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
};
