import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initAdmin, isAuthorized } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await isAuthorized(req))) return res.status(403).json({ error: 'Unauthorized' });

  const { db } = initAdmin();
  
  try {
    const statsSnapshot = await db.collection('stats').get();
    const stats = statsSnapshot.docs.map(doc => doc.data());

    const indexingSnapshot = await db.collection('indexing_status').get();
    const indexing = indexingSnapshot.docs.map(doc => doc.data());

    res.json({ stats, indexing });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
