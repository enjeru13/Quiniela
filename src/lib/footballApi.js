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

let _scorersCache = null;
let _scorersCacheAt = 0;
const SCORERS_TTL = 5 * 60_000;

export async function getWCScorers(limit = 20) {
  if (_scorersCache && Date.now() - _scorersCacheAt < SCORERS_TTL)
    return _scorersCache;
  const res = await fetch(`${BASE}/competitions/WC/scorers?limit=${limit}`);
  if (!res.ok) throw new Error(`football-data.org ${res.status}`);
  const { scorers } = await res.json();
  _scorersCache = scorers ?? [];
  _scorersCacheAt = Date.now();
  return _scorersCache;
}
