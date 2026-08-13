// This is a static, read-only site (served from GitHub Pages) — entries are
// bundled as a plain JSON file rather than fetched from a live backend. To
// add or change an entry, edit data/entries.json and push.

const DATA_URL = 'data/entries.json';

let cache = {};

export async function loadAll() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('Failed to load stats');
  cache = await res.json();
  return cache;
}

export function getEntries(metricId) {
  return (cache[metricId] || []).slice().sort((a, b) => a.date.localeCompare(b.date));
}
