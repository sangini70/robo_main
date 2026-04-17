import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parse } from 'cookie';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cookies = parse(req.headers.cookie || '');
  if (cookies.admin_session === 'authenticated') {
    return res.json({ authenticated: true });
  }
  res.json({ authenticated: false });
}
