const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

let db;

function getDb() {
  if (!db) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      throw new Error("FIREBASE_PROJECT_ID is not configured in environment variables");
    }
    const app = initializeApp({
      credential: cert({
        projectId: projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      }),
    });
    db = getFirestore(app);
    // Use REST transport instead of gRPC to avoid OpenSSL 3 / Node 22 cipher incompatibility
    db.settings({ preferRest: true });
  }
  return db;
}

module.exports = { getDb };
