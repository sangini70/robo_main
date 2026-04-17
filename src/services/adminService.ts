
import { MarketSignal } from '../types';

export async function checkAuth(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/check-auth');
    const data = await res.json();
    return data.authenticated;
  } catch (err) {
    return false;
  }
}

export async function login(idToken: string): Promise<boolean> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  return res.ok;
}

export async function logout(): Promise<void> {
  await fetch('/api/admin/logout', { method: 'POST' });
}

export async function getDashboardStats() {
  const res = await fetch('/api/admin/stats');
  if (!res.ok) throw new Error('Unauthorized');
  return res.json(); // Now returns { stats, indexing }
}

export async function updateIndexingStatus(slug: string, platform: 'google' | 'naver', status: string): Promise<boolean> {
  const res = await fetch('/api/admin/indexing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, platform, status })
  });
  return res.ok;
}

export async function backupDatabase(): Promise<boolean> {
  const res = await fetch('/api/admin/backup', { method: 'POST' });
  return res.ok;
}

export async function fetchSignals(): Promise<MarketSignal[]> {
  const res = await fetch('/api/admin/signals');
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

export async function saveSignals(signals: MarketSignal[]): Promise<boolean> {
  const res = await fetch('/api/admin/signals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signals)
  });
  return res.ok;
}

export async function fetchAdminPosts(): Promise<any[]> {
  const res = await fetch('/api/admin/posts');
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}

export async function saveAdminPost(post: any): Promise<boolean> {
  const res = await fetch('/api/admin/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post)
  });
  return res.ok;
}

export async function deleteAdminPost(slug: string): Promise<boolean> {
  const res = await fetch(`/api/admin/posts/${slug}`, {
    method: 'DELETE'
  });
  return res.ok;
}

export async function publishStaticContent(): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/admin/publish', { method: 'POST' });
  return res.json();
}
