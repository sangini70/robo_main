import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isAuthorized } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await isAuthorized(req))) return res.status(403).json({ error: 'Unauthorized' });

  // In a Vercel serverless environment, writing to the public directory is not possible.
  // Content should instead be fetched directly from Firestore via API endpoints.
  
  res.json({ 
    success: true, 
    message: "Content is now served directly from Firestore via Serverless APIs." 
  });
}
