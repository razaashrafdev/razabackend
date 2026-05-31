const { getDb } = require("../config/firebase");
const { FieldValue, FieldPath } = require("firebase-admin/firestore");
const ALLOWED_PATH_REGEX = /^\/[a-zA-Z0-9/_-]{0,200}$/;

function normalizePath(pathValue) {
  let path = String(pathValue).trim();
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

function localDayKey(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Firestore map keys cannot safely use raw URL paths (e.g. "/projects") with dot notation. */
function encodePathKey(pathValue) {
  return Buffer.from(pathValue, "utf8").toString("base64url");
}

function decodePathKey(key) {
  if (!key) return "/";
  if (key.startsWith("/")) return key;
  try {
    const decoded = Buffer.from(key, "base64url").toString("utf8");
    if (decoded.startsWith("/")) return decoded;
  } catch (_err) {
    // Fall through for legacy keys.
  }
  return key.replace(/_/g, ".");
}

function normalizeCount(value) {
  if (typeof value === "number") return value;
  if (value && typeof value.toNumber === "function") return value.toNumber();
  return Number(value) || 0;
}

exports.recordVisit = async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ error: "Path is required" });
    }
    const pathValue = normalizePath(path);
    if (!pathValue || pathValue.length > 201) {
      return res.status(400).json({ error: "Invalid path length" });
    }
    if (!ALLOWED_PATH_REGEX.test(pathValue)) {
      return res.status(400).json({ error: "Invalid path format" });
    }
    const sanitizedPathKey = encodePathKey(pathValue);
    if (!sanitizedPathKey || sanitizedPathKey.length > 200) {
      return res.status(400).json({ error: "Invalid path length" });
    }

    const db = getDb();
    const today = new Date();
    const dayKey = localDayKey(today);

    const docRef = db.collection("analytics").doc(dayKey);

    await docRef.set(
      {
        date: dayKey,
        timestamp: today.getTime(),
        views: FieldValue.increment(1),
      },
      { merge: true }
    );

    await docRef.update(new FieldPath("paths", sanitizedPathKey), FieldValue.increment(1));

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getStats = async (req, res) => {
  try {
    const db = getDb();
    
    // Fetch last 365 days of data (simplification using date strings)
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 365);
    const startKey = localDayKey(d);

    const snapshot = await db
      .collection("analytics")
      .where("date", ">=", startKey)
      .get();

    const allDocs = [];
    snapshot.forEach((doc) => {
      allDocs.push(doc.data());
    });

    const todayDate = new Date();
    const todayKey = localDayKey(todayDate);

    // Calculate Week Views (Last 7 days)
    const weekAgo = new Date();
    weekAgo.setUTCDate(weekAgo.getUTCDate() - 6);
    const weekKey = localDayKey(weekAgo);

    let totalViews = 0;
    let todayViews = 0;
    let weekViews = 0;
    const pathCounts = {};

    allDocs.forEach((doc) => {
      totalViews += doc.views || 0;
      if (doc.date === todayKey) {
        todayViews += doc.views || 0;
      }
      if (doc.date >= weekKey) {
        weekViews += doc.views || 0;
      }
      if (doc.paths) {
        for (const [p, count] of Object.entries(doc.paths)) {
          const originalPath = decodePathKey(p);
          pathCounts[originalPath] = (pathCounts[originalPath] || 0) + normalizeCount(count);
        }
      }
    });

    const topPages = Object.entries(pathCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // Last 30 Days mapping
    const dailyTotals = {};
    allDocs.forEach((doc) => {
      dailyTotals[doc.date] = doc.views || 0;
    });

    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const iterD = new Date();
      iterD.setUTCDate(iterD.getUTCDate() - i);
      const dayKey = localDayKey(iterD);
      last30Days.push({
        dayKey,
        label: `${iterD.toLocaleString('default', { month: 'short' })} ${iterD.getUTCDate()}`,
        count: dailyTotals[dayKey] || 0,
      });
    }

    // Last 12 Months mapping
    const monthlyTotals = {};
    allDocs.forEach((doc) => {
      const monthKey = doc.date.substring(0, 7); // yyyy-mm
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + (doc.views || 0);
    });

    const last12Months = [];
    const currentYear = new Date().getUTCFullYear();
    for (let i = 0; i < 12; i++) {
      const iterM = new Date();
      iterM.setUTCFullYear(currentYear);
      iterM.setUTCMonth(i);
      iterM.setUTCDate(1);
      const mStr = String(i + 1).padStart(2, "0");
      const monthKey = `${currentYear}-${mStr}`;
      
      last12Months.push({
        monthKey,
        label: `${iterM.toLocaleString('default', { month: 'short' })} ${currentYear}`,
        count: monthlyTotals[monthKey] || 0,
      });
    }

    res.status(200).json({
      totalViews,
      todayViews,
      weekViews,
      topPages,
      last30Days,
      last12Months,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
