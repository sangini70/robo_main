import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initAdmin, isAuthorized } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await isAuthorized(req))) return res.status(403).json({ error: 'Unauthorized' });

  const { db } = initAdmin();

  try {
    const allStats = (await db.collection('stats').get()).docs.map(d => d.data());
    // In Vercel, we can't save to a local folder persisted across turns.
    // We'll return the JSON directly for the user to download or save.
    res.setHeader('Content-Disposition', 'attachment; filename="stats-backup.json"');
    res.json(allStats);
  } catch (err) {
    res.status(500).json({ error: 'Backup failed' });
  }
}
