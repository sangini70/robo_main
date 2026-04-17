import admin from 'firebase-admin';

export function initAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "robo-advisor-prod",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  
  const db = admin.firestore();
  const dbId = process.env.VITE_FIREBASE_FIRESTORE_DB_ID;
  if (dbId) {
    // @ts-ignore
    if (db.settings) db.settings({ databaseId: dbId });
  }
  
  return { admin, db };
}

export async function isAuthorized(req: any) {
  const cookieHeader = req.headers.cookie || '';
  return cookieHeader.includes('admin_session=authenticated');
}
