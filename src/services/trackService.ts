
const TRACK_DELAY = 12 * 60 * 60 * 1000; // 12 hours

function shouldTrack(slug: string, type: 'view' | 'click' | 'impression'): boolean {
  const key = `track_${type}_${slug}`;
  const lastTracked = localStorage.getItem(key);
  if (!lastTracked) return true;
  
  return Date.now() - Number(lastTracked) > TRACK_DELAY;
}

function markTracked(slug: string, type: 'view' | 'click' | 'impression') {
  const key = `track_${type}_${slug}`;
  localStorage.setItem(key, Date.now().toString());
}

export async function trackView(slug: string) {
  if (!shouldTrack(slug, 'view')) return;
  try {
    const res = await fetch('/api/track/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug })
    });
    if (res.ok) markTracked(slug, 'view');
  } catch (err) {
    console.error('Track view failed', err);
  }
}

export async function trackClick(slug: string) {
  if (!shouldTrack(slug, 'click')) return;
  try {
    const res = await fetch('/api/track/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug })
    });
    if (res.ok) markTracked(slug, 'click');
  } catch (err) {
    console.error('Track click failed', err);
  }
}

export async function trackImpression(slug: string) {
  if (!shouldTrack(slug, 'impression')) return;
  try {
    const res = await fetch('/api/track/impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug })
    });
    if (res.ok) markTracked(slug, 'impression');
  } catch (err) {
    console.error('Track impression failed', err);
  }
}
