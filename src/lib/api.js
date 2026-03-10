// AI Radar Extension — API Client (src/lib/api.js)
// Reads all data from GitHub Pages backend
// Replace BACKEND_URL with your actual GitHub Pages URL

const BACKEND_URL = "https://YOUR_USERNAME.github.io/ai-radar-backend";
const CACHE_TTL   = 5 * 60 * 1000; // 5 minutes client-side cache

// ── Cache ─────────────────────────────────────────────────────────────────────

const memCache = new Map();

function getCached(key) {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { memCache.delete(key); return null; }
  return entry.data;
}

function setCache(key, data) {
  memCache.set(key, { data, ts: Date.now() });
}

// ── Core fetch ────────────────────────────────────────────────────────────────

async function apiFetch(path) {
  const url      = `${BACKEND_URL}/${path}`;
  const cached   = getCached(url);
  if (cached) return cached;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
  const data = await res.json();
  setCache(url, data);
  return data;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getLatestNews() {
  const data = await apiFetch("latest.json");
  return data.items || [];
}

export async function getBreakingNews() {
  const data = await apiFetch("breaking.json");
  return data.items || [];
}

export async function getTrending() {
  const data = await apiFetch("trending.json");
  return data.trending || [];
}

export async function getMetadata() {
  return apiFetch("metadata.json");
}

export async function getAvailableDates() {
  const data = await apiFetch("index.json");
  return Array.isArray(data) ? data : [];
}

export async function getNewsByDate(dateKey) {
  // dateKey format: DD-MM-YYYY
  const [dd, mm, yyyy] = dateKey.split("-");
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const month = monthNames[parseInt(mm, 10) - 1];
  const data  = await apiFetch(`${yyyy}/${month}/${dateKey}.json`);
  return data.items || [];
}

export function getBackendUrl() {
  return BACKEND_URL;
}

export function setBackendUrl(url) {
  // Allow user to override backend URL in settings
  const clean = url.replace(/\/$/, "");
  Object.defineProperty(
    { BACKEND_URL: clean },
    "BACKEND_URL",
    { value: clean, writable: true }
  );
}
