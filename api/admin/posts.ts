import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initAdmin, isAuthorized } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await isAuthorized(req))) return res.status(403).json({ error: 'Unauthorized' });

  const { db } = initAdmin();

  if (req.method === 'GET') {
    try {
      const snapshot = await db.collection('posts').get();
      const posts = snapshot.docs.map(doc => doc.data());
      return res.json(posts);
    } catch (e) {
      return res.status(500).json({ error: "Failed to fetch posts" });
    }
  }

  if (req.method === 'POST') {
    try {
      const post = req.body;
      if (!post.slug) return res.status(400).json({ error: "Slug is required" });
      
      await db.collection('posts').doc(post.slug).set({
        ...post,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: "Failed to save post" });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { slug } = req.query;
      if (!slug) return res.status(400).json({ error: "Slug is required" });
      await db.collection('posts').doc(slug as string).delete();
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: "Failed to delete post" });
    }
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
