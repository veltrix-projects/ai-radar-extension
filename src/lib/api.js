// AI Radar Extension — API Client (src/lib/api.js)
// Reads all data from GitHub Pages backend

const DEFAULT_BACKEND = "https://veltrix-projects.github.io/ai-radar-backend";
const CACHE_TTL       = 5 * 60 * 1000; // 5 minutes client-side cache

// ── Runtime backend URL (can be overridden via settings) ──────────────────────

let _backendUrl = DEFAULT_BACKEND;

export function getBackendUrl() {
  return _backendUrl;
}

export function setBackendUrl(url) {
  _backendUrl = url.replace(/\/$/, "");
}

// Load saved backend URL from chrome storage on startup
if (typeof chrome !== "undefined" && chrome.storage) {
  chrome.storage.local.get("backendUrl", ({ backendUrl }) => {
    if (backendUrl) _backendUrl = backendUrl.replace(/\/$/, "");
  });
}

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
  const url    = `${_backendUrl}/${path}`;
  const cached = getCached(url);
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

export async function testConnection() {
  try {
    const meta = await apiFetch("metadata.json");
    return { ok: true, lastUpdated: meta.lastUpdated, count: meta.todayCount };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
