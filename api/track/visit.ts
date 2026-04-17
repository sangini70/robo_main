import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initAdmin } from '../_lib/db';
import crypto from 'crypto';
import admin from 'firebase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { slug } = req.body;
  if (!slug) return res.status(400).json({ error: "slug required" });

  const { db } = initAdmin();

  // Basic bot/duplicate filtering
  const ip = req.headers['x-forwarded-for'] || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  if (ua.toString().toLowerCase().includes('bot')) return res.json({ success: true });

  const hash = crypto.createHash('sha256').update(`${ip}-${ua}-${slug}-visit`).digest('hex');
  const now = Date.now();
  const trackRef = db.collection('track_logs').doc(hash);

  try {
    const doc = await trackRef.get();
    if (doc.exists) {
      const data = doc.data();
      if (data && now - data.timestamp < 24 * 60 * 60 * 1000) {
         return res.json({ success: true }); // Already tracked
      }
    }
    await trackRef.set({ hash, slug, type: 'visit', timestamp: now });
    
    // Increment visit
    const statRef = db.collection('stats').doc(slug);
    await statRef.set({
      slug,
      visits: admin.firestore.FieldValue.increment(1),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    res.json({ success: true });
  } catch (e) {
    res.json({ success: true }); // Fail silently for analytics
  }
}
