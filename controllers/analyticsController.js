const { getDb } = require("../config/firebase");
const { FieldValue } = require("firebase-admin/firestore");

function localDayKey(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

exports.recordVisit = async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ error: "Path is required" });
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
        [`paths.${path.replace(/\./g, "_")}`]: FieldValue.increment(1),
      },
      { merge: true }
    );

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Error recording visit:", err);
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
          const originalPath = p.replace(/_/g, ".");
          pathCounts[originalPath] = (pathCounts[originalPath] || 0) + count;
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
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
