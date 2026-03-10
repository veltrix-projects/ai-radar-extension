// AI Radar v2 — Shared Utilities (src/lib/utils.js)

// ── Time ─────────────────────────────────────────────────────────────────────

export function timeAgo(ts) {
  if (!ts) return "unknown";
  const date = typeof ts === "number" ? new Date(ts) : new Date(ts);
  if (isNaN(date)) return "unknown";
  const diff = Date.now() - date.getTime();
  const sec  = Math.floor(diff / 1000);
  const min  = Math.floor(sec  / 60);
  const hr   = Math.floor(min  / 60);
  const day  = Math.floor(hr   / 24);
  if (sec < 60)  return "just now";
  if (min < 60)  return `${min}m ago`;
  if (hr  < 24)  return `${hr}h ago`;
  if (day <  7)  return `${day}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function truncate(str, max = 100) {
  if (!str) return "";
  return str.length <= max ? str : str.slice(0, max - 1) + "…";
}

// ── Type / priority display ───────────────────────────────────────────────────

export function typeLabel(type) {
  return { model:"MODEL", research:"PAPER", tool:"TOOL", news:"NEWS" }[type] || "NEWS";
}

export function typeColor(type) {
  return { model:"#00F5FF", research:"#FFD600", tool:"#00FF88", news:"#888" }[type] || "#888";
}

export function priorityColor(priority) {
  return { HIGH:"#FF2D55", MEDIUM:"#FF6B00", LOW:"#555" }[priority] || "#555";
}

export function sourceShortName(source = "") {
  const map = {
    "Hacker News":             "HN",
    "HuggingFace Papers":      "HF Papers",
    "HuggingFace Models":      "HF Models",
    "ArXiv":                   "ArXiv",
    "GitHub":                  "GitHub",
    "Reddit r/LocalLLaMA":     "r/LocalLLaMA",
    "Reddit r/MachineLearning":"r/ML",
    "Product Hunt":            "PH",
    "OpenAI Blog":             "OpenAI",
    "Anthropic Blog":          "Anthropic",
    "Google DeepMind":         "DeepMind",
    "Meta AI Blog":            "Meta AI",
    "NVIDIA Blog":             "NVIDIA",
    "VentureBeat AI":          "VentureBeat",
    "TechCrunch AI":           "TechCrunch",
    "Papers With Code":        "PWC",
  };
  return map[source] || source;
}

// ── Chrome messaging ─────────────────────────────────────────────────────────

export function sendMsg(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, ...payload }, (res) => {
      chrome.runtime.lastError
        ? reject(new Error(chrome.runtime.lastError.message))
        : resolve(res);
    });
  });
}

export async function getUnreadCount() {
  try   { return (await sendMsg("GET_UNREAD_COUNT"))?.count || 0; }
  catch { return 0; }
}

export async function markVisited() {
  try { await sendMsg("MARK_VISITED"); } catch {}
}

export async function forceRefresh() {
  try { await sendMsg("FORCE_REFRESH"); } catch {}
}
