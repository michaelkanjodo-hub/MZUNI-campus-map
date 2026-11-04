import { readCampusSnapshot, saveCampusSnapshot } from './storage';

async function fetchJson(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Could not load ${url}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

// Prefer fresh admin-managed data, then the static GeoJSON bundled with the
// PWA. IndexedDB is the final offline fallback if both network requests fail.
export async function loadCampus() {
  let snapshot = null;
  try {
    const campus = await fetchJson('/api/campus');
    await saveCampusSnapshot(campus);
    return { campus, source: 'server' };
  } catch { /* static hosting or offline: continue below */ }

  try {
    const campus = await fetchJson('/data/campus.geojson');
    await saveCampusSnapshot(campus);
    return { campus, source: 'bundled' };
  } catch {
    snapshot = await readCampusSnapshot();
    if (snapshot) return { campus: snapshot, source: 'offline' };
  }
  throw new Error('Campus data is not available yet. Connect once to download it, then try again.');
}

export function onlineStatus() {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}
