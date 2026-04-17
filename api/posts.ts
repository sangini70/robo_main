import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initAdmin } from './_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { db } = initAdmin();
  try {
    const snapshot = await db.collection('posts').get();
    const posts = snapshot.docs.map(doc => doc.data());
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
}
