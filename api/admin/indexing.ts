import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initAdmin, isAuthorized } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await isAuthorized(req))) return res.status(403).json({ error: 'Unauthorized' });

  const { db } = initAdmin();

  if (req.method === 'GET') {
    try {
      const snapshot = await db.collection('indexing_status').get();
      const statuses = snapshot.docs.map(doc => doc.data());
      return res.json(statuses);
    } catch (e) {
      return res.status(500).json({ error: "Failed to fetch indexing status" });
    }
  }

  if (req.method === 'POST') {
    try {
      const { slug, platform, status } = req.body;
      const field = platform === 'google' ? 'google_status' : 'naver_status';
      const now = new Date().toISOString();
      
      const indexingRef = db.collection('indexing_status').doc(slug);
      await indexingRef.set({
        slug,
        [field]: status,
        updatedAt: now
      }, { merge: true });
      
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: "Failed to save indexing status" });
    }
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
