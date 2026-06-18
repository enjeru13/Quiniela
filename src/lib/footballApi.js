// /api/fd proxied by Vite in dev, by Netlify function in prod — never exposes API key to browser
const BASE = "/api/fd/v4";

let _cache = null;
let _cacheAt = 0;
const TTL = 60_000;

export async function getWCMatches() {
  if (_cache && Date.now() - _cacheAt < TTL) return _cache;
  const res = await fetch(`${BASE}/competitions/WC/matches`);
  if (!res.ok) throw new Error(`football-data.org ${res.status}`);
  const { matches } = await res.json();
  _cache = matches;
  _cacheAt = Date.now();
  return matches;
}

export function invalidateCache() {
  _cache = null;
}
