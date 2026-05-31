const { getDb } = require("../config/firebase");

const STATS_DOC_ID = "portfolio";

const DEFAULT_STATS = {
  yearsExperience: "1+",
  projectsCompleted: "10+",
  happyClients: "5+",
};

function normalizeValue(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || trimmed.length > 20) return null;
  return trimmed;
}

async function readOrSeedStats(db) {
  const docRef = db.collection("siteStats").doc(STATS_DOC_ID);
  const doc = await docRef.get();

  if (!doc.exists) {
    const now = new Date().toISOString();
    const data = { ...DEFAULT_STATS, createdAt: now, updatedAt: now };
    await docRef.set(data);
    return data;
  }

  return doc.data();
}

async function getStats(req, res) {
  try {
    const db = getDb();
    const data = await readOrSeedStats(db);
    return res.status(200).json({
      success: true,
      data: {
        yearsExperience: data.yearsExperience,
        projectsCompleted: data.projectsCompleted,
        happyClients: data.happyClients,
        updatedAt: data.updatedAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch site statistics" });
  }
}

async function updateStats(req, res) {
  const { yearsExperience, projectsCompleted, happyClients } = req.body || {};

  const nextYears = yearsExperience !== undefined ? normalizeValue(yearsExperience) : undefined;
  const nextProjects = projectsCompleted !== undefined ? normalizeValue(projectsCompleted) : undefined;
  const nextClients = happyClients !== undefined ? normalizeValue(happyClients) : undefined;

  if (
    (yearsExperience !== undefined && !nextYears) ||
    (projectsCompleted !== undefined && !nextProjects) ||
    (happyClients !== undefined && !nextClients)
  ) {
    return res.status(400).json({ error: "Each statistic must be a non-empty value (max 20 characters)" });
  }

  if (nextYears === undefined && nextProjects === undefined && nextClients === undefined) {
    return res.status(400).json({ error: "At least one statistic is required" });
  }

  try {
    const db = getDb();
    const docRef = db.collection("siteStats").doc(STATS_DOC_ID);
    const existing = await readOrSeedStats(db);

    const updateData = {
      yearsExperience: nextYears ?? existing.yearsExperience,
      projectsCompleted: nextProjects ?? existing.projectsCompleted,
      happyClients: nextClients ?? existing.happyClients,
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(updateData, { merge: true });
    const updated = await docRef.get();

    return res.status(200).json({
      success: true,
      data: {
        yearsExperience: updated.data().yearsExperience,
        projectsCompleted: updated.data().projectsCompleted,
        happyClients: updated.data().happyClients,
        updatedAt: updated.data().updatedAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update site statistics" });
  }
}

module.exports = {
  getStats,
  updateStats,
};
