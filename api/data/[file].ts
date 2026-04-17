import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initAdmin } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { file } = req.query;
  const fileName = file as string;
  
  const { db } = initAdmin();

  try {
    if (fileName === 'posts.json') {
      const snapshot = await db.collection('posts').get();
      const posts = snapshot.docs.map(doc => doc.data());
      return res.json(posts);
    }

    if (fileName === 'signals.json') {
      const snapshot = await db.collection('signals').get();
      const signals = snapshot.docs.map(doc => doc.data());
      return res.json(signals);
    }

    if (fileName === 'flow-index.json') {
      const snapshot = await db.collection('posts').get();
      const posts = snapshot.docs.map(doc => doc.data());
      const flowIndex: any = {};
      posts.forEach((p: any) => {
        if (!flowIndex[p.hub]) flowIndex[p.hub] = {};
        if (!flowIndex[p.hub][p.flowStep]) flowIndex[p.hub][p.flowStep] = [];
        flowIndex[p.hub][p.flowStep].push(p.slug);
      });
      return res.json(flowIndex);
    }

    res.status(404).json({ error: 'Not Found' });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
}
