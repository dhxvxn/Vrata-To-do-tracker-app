// Vrata Focus — background service worker (MV3).
// Accumulates active seconds per domain (and per YouTube video) while a window is
// focused and the user isn't idle. Active state is persisted so counting survives
// the service worker being suspended; a 1-minute alarm flushes elapsed time.

importScripts('config.js');

const DEFAULT_ACTIVE = { domain: null, url: null, title: null, videoId: null, since: Date.now(), idle: false, focused: true };

function getActive() {
  return new Promise(res => chrome.storage.local.get('active', r => res(Object.assign({}, DEFAULT_ACTIVE, r.active || {}))));
}
function setActive(a) {
  return new Promise(res => chrome.storage.local.set({ active: a }, res));
}

function parseVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.pathname === '/watch') return u.searchParams.get('v');
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
  } catch (e) { /* ignore */ }
  return null;
}

// Add the time elapsed since the last checkpoint to today's totals.
async function flush() {
  const a = await getActive();
  const now = Date.now();
  const elapsed = Math.round((now - (a.since || now)) / 1000);
  a.since = now;
  await setActive(a);
  if (elapsed <= 0 || elapsed > 3600) return;          // ignore huge gaps (sleep)
  if (a.idle || !a.focused || !a.domain) return;

  const cfg = await getConfig();
  const key = todayKey();
  const day = await getDay(key);
  day.domains[a.domain] = (day.domains[a.domain] || 0) + elapsed;

  if (a.videoId) {
    const prev = day.videos[a.videoId] || { title: a.title || '', seconds: 0 };
    prev.seconds += elapsed;
    if (a.title) prev.title = a.title;
    const c = classifyTitle(prev.title, cfg);
    prev.productive = c.productive;
    prev.gateRelated = c.gateRelated;
    day.videos[a.videoId] = prev;
  }
  await saveDay(key, day);
}

async function setActiveFromTab(tab) {
  await flush();
  const a = await getActive();
  if (!tab || !tab.url || tab.url.startsWith('chrome') || tab.url.startsWith('edge') || tab.url.startsWith('about')) {
    a.domain = null; a.url = null; a.title = null; a.videoId = null;
  } else {
    a.url = tab.url; a.title = tab.title || ''; a.domain = rootDomain(tab.url); a.videoId = parseVideoId(tab.url);
  }
  a.since = Date.now();
  await setActive(a);
}

async function refreshActive() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    await setActiveFromTab(tab);
  } catch (e) { /* ignore */ }
}

chrome.tabs.onActivated.addListener(refreshActive);
chrome.tabs.onUpdated.addListener((id, info, tab) => { if (tab.active && (info.url || info.title)) setActiveFromTab(tab); });
chrome.windows.onFocusChanged.addListener(async winId => {
  await flush();
  const a = await getActive();
  a.focused = winId !== chrome.windows.WINDOW_ID_NONE;
  await setActive(a);
  if (a.focused) refreshActive();
});
chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener(async state => {
  await flush();
  const a = await getActive();
  a.idle = state !== 'active';
  await setActive(a);
  if (!a.idle) refreshActive();
});

chrome.alarms.create('flush', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(a => { if (a.name === 'flush') flush(); });
chrome.runtime.onInstalled.addListener(refreshActive);
chrome.runtime.onStartup.addListener(refreshActive);
