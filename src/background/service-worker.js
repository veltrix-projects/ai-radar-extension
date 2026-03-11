// AI Radar Extension — Service Worker (src/background/service-worker.js)
// Simplified: no local fetching, no IndexedDB, no offscreen doc
// Just refreshes badge count and sends notifications for breaking news

const ALARM_NAME   = "ai-radar-refresh";
const INTERVAL     = 5; // minutes — how often to check for new breaking news
const BACKEND_BASE = "https://veltrix-projects.github.io/ai-radar-backend";

// ── Lifecycle ────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await ensureAlarm();
  if (reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
  }
  await refresh();
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureAlarm();
  await refresh();
});

// ── Alarm ────────────────────────────────────────────────────────────────────

async function ensureAlarm() {
  const existing = await chrome.alarms.get(ALARM_NAME);
  if (!existing) {
    chrome.alarms.create(ALARM_NAME, { delayInMinutes: INTERVAL, periodInMinutes: INTERVAL });
  }
}

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === ALARM_NAME) refresh();
});

// ── Refresh ───────────────────────────────────────────────────────────────────

async function refresh() {
  try {
    // Check breaking news for notifications
    const { notificationsEnabled = true } = await chrome.storage.local.get("notificationsEnabled");
    if (notificationsEnabled) await checkBreaking();

    // Update badge with today's item count
    await updateBadge();

    // Notify open dashboard tabs
    broadcast({ type: "REFRESH" });
  } catch (err) {
    console.warn("[AI Radar] Refresh failed:", err.message);
  }
}

async function checkBreaking() {
  const res  = await fetch(`${BACKEND_BASE}/breaking.json`, { cache: "no-store" });
  if (!res.ok) return;
  const data = await res.json();
  const items = data.items || [];

  const { lastNotifTime = 0, notifiedIds = [] } = await chrome.storage.local.get(["lastNotifTime", "notifiedIds"]);
  if (Date.now() - lastNotifTime < 5 * 60_000) return;

  const fresh = items.filter(i => !notifiedIds.includes(i.id)).slice(0, 2);
  if (!fresh.length) return;

  for (const item of fresh) {
    await sendNotification(item);
  }

  const newNotifiedIds = [...notifiedIds, ...fresh.map(i => i.id)].slice(-50);
  await chrome.storage.local.set({ lastNotifTime: Date.now(), notifiedIds: newNotifiedIds });
}

async function updateBadge() {
  const res = await fetch(`${BACKEND_BASE}/metadata.json`, { cache: "no-store" });
  if (!res.ok) return;
  const meta = await res.json();

  const { lastVisit = 0 } = await chrome.storage.local.get("lastVisit");
  const lastUpdated = new Date(meta.lastUpdated).getTime();

  if (lastUpdated > lastVisit && meta.highCount > 0) {
    chrome.action.setBadgeText({ text: meta.highCount > 99 ? "99+" : String(meta.highCount) });
    chrome.action.setBadgeBackgroundColor({ color: "#00F5FF" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

async function sendNotification(item) {
  const typeEmoji = { model:"🤖", research:"📄", tool:"🔧", news:"📡" };
  const id = `airadar_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  chrome.notifications.create(id, {
    type:     "basic",
    iconUrl:  chrome.runtime.getURL("icons/icon48.png"),
    title:    `${typeEmoji[item.type] || "📡"} Breaking AI News`,
    message:  item.title?.slice(0, 100) || "New update",
    priority: 2,
  });

  await chrome.storage.local.set({ [`notif_${id}`]: item.url });
}

// ── Broadcast ────────────────────────────────────────────────────────────────

function broadcast(message) {
  chrome.tabs.query({}, tabs => {
    for (const tab of tabs) {
      if (tab.url?.includes(chrome.runtime.id)) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {});
      }
    }
  });
}

// ── Messages ─────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  switch (msg.type) {
    case "MARK_VISITED":
      chrome.storage.local.set({ lastVisit: Date.now() }).then(() => {
        chrome.action.setBadgeText({ text: "" });
        reply({ ok: true });
      });
      return true;

    case "GET_UNREAD_COUNT":
      (async () => {
        const res = await fetch(`${BACKEND_BASE}/metadata.json`, { cache: "no-store" }).catch(() => null);
        if (!res?.ok) { reply({ ok: true, count: 0 }); return; }
        const meta = await res.json();
        const { lastVisit = 0 } = await chrome.storage.local.get("lastVisit");
        const isNew = new Date(meta.lastUpdated).getTime() > lastVisit;
        reply({ ok: true, count: isNew ? (meta.highCount || 0) : 0 });
      })();
      return true;

    case "FORCE_REFRESH":
      refresh().then(() => reply({ ok: true })).catch(e => reply({ ok: false, error: e.message }));
      return true;
  }
});

// ── Notification click ────────────────────────────────────────────────────────

chrome.notifications.onClicked.addListener(async id => {
  const key    = `notif_${id}`;
  const result = await chrome.storage.local.get(key);
  if (result[key]) {
    chrome.tabs.create({ url: result[key], active: true });
    chrome.notifications.clear(id);
    chrome.storage.local.remove(key);
  }
});
