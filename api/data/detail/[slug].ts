import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initAdmin } from '../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug } = req.query;
  const postSlug = slug as string;
  
  const { db } = initAdmin();

  try {
    const doc = await db.collection('posts').doc(postSlug.replace('.json', '')).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not Found' });
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
}
