import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initAdmin, isAuthorized } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await isAuthorized(req))) return res.status(403).json({ error: 'Unauthorized' });

  const { db } = initAdmin();

  if (req.method === 'GET') {
    try {
      const snapshot = await db.collection('signals').get();
      const signals = snapshot.docs.map(doc => doc.data());
      return res.json(signals);
    } catch (e) {
      return res.status(500).json({ error: "Failed to fetch signals" });
    }
  }

  if (req.method === 'POST') {
    try {
      const signals = req.body;
      const batch = db.batch();
      const signalsRef = db.collection('signals');
      
      signals.forEach((s: any) => {
        const ref = signalsRef.doc(s.id.toString());
        batch.set(ref, s);
      });
      
      await batch.commit();
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: "Failed to save signals" });
    }
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
