import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import { serialize } from 'cookie';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || "robo-advisor-prod",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { idToken } = req.body;

  const adminUIDs = [
    "3B7P7yh5Mfd5wx7fqJdkfqTzw1",
    "O8T7pyXh5Mfd5wx7fqJdkfqTzw1" // Added based on previous confirmation
  ];

  const adminEmails = [
    "luganopizza@gmail.com"
  ];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const uid = decodedToken.uid;
    const email = decodedToken.email?.trim().toLowerCase();
    const verified = decodedToken.email_verified;

    console.log(`[AUTH SERVERLESS] uid=${uid}, email=${email}, verified=${verified}`);

    const isAllowedUid = adminUIDs.includes(uid);
    const isAllowedEmail = email ? adminEmails.includes(email) : false;

    if ((isAllowedUid || isAllowedEmail) && verified) {
      // Set the session cookie to match existing authentication logic
      const cookie = serialize('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
      });
      
      res.setHeader('Set-Cookie', cookie);
      return res.status(200).json({ success: true });
    }

    return res.status(403).json({ error: 'UNAUTHORIZED' });

  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ error: 'INVALID TOKEN' });
  }
}
