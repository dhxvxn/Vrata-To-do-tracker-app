// Shared config + classification helpers (loaded by the service worker via
// importScripts and by popup/options via <script>). Plain global functions.

const DEFAULT_CONFIG = {
  studyDomains: [
    'leetcode.com', 'github.com', 'geeksforgeeks.org', 'nptel.ac.in', 'stackoverflow.com',
    'developer.mozilla.org', 'coursera.org', 'khanacademy.org', 'w3schools.com', 'tutorialspoint.com',
    'codeforces.com', 'hackerrank.com', 'kaggle.com', 'arxiv.org', 'notion.so', 'docs.google.com',
    'wikipedia.org', 'gateoverflow.in', 'javatpoint.com', 'programiz.com', 'cp-algorithms.com',
    'chat.openai.com', 'claude.ai', 'gemini.google.com', 'overleaf.com', 'brilliant.org'
  ],
  distractionDomains: [
    'instagram.com', 'facebook.com', 'x.com', 'twitter.com', 'reddit.com', 'netflix.com',
    'primevideo.com', 'hotstar.com', 'tiktok.com', 'snapchat.com', 'pinterest.com', '9gag.com',
    'twitch.tv', 'discord.com'
  ],
  // Broad — any genuine learning counts as productive, not just GATE.
  studyKeywords: [
    'gate', 'algorithm', 'data structure', 'dsa', 'operating system', 'dbms', 'database',
    'computer network', 'compiler', 'theory of computation', 'automata', 'digital logic',
    'computer organization', 'architecture', 'aptitude', 'discrete', 'calculus', 'linear algebra',
    'probability', 'statistics', 'physics', 'chemistry', 'ai', 'artificial intelligence',
    'machine learning', 'deep learning', 'neural network', 'nlp', 'transformer', 'llm',
    'programming', 'python', 'java', 'c++', 'javascript', 'react', 'coding', 'tutorial', 'lecture',
    'course', 'lesson', 'explained', 'crash course', 'exam', 'revision', 'concept', 'theorem',
    'engineering', 'science', 'interview', 'system design', 'math', 'mathematics'
  ]
};

const GATE_TERMS = [
  'gate', 'operating system', 'dbms', 'computer network', 'compiler', 'theory of computation',
  'automata', 'digital logic', 'computer organization', 'data structure', 'algorithm', 'aptitude', 'discrete'
];

function rootDomain(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '');
    const parts = h.split('.');
    return parts.length > 2 ? parts.slice(-2).join('.') : h;
  } catch (e) { return ''; }
}

function todayKey(d) {
  const x = d || new Date();
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}

function classifyDomain(domain, cfg) {
  const d = (domain || '').toLowerCase();
  if (cfg.studyDomains.some(s => d.includes(s))) return 'study';
  if (cfg.distractionDomains.some(s => d.includes(s))) return 'distraction';
  return 'other';
}

function classifyTitle(title, cfg) {
  const t = (title || '').toLowerCase();
  return {
    productive: cfg.studyKeywords.some(k => t.includes(k)),
    gateRelated: GATE_TERMS.some(k => t.includes(k)),
  };
}

function getConfig() {
  return new Promise(res => chrome.storage.local.get('config', r => res(Object.assign({}, DEFAULT_CONFIG, r.config || {}))));
}
function saveConfig(cfg) {
  return new Promise(res => chrome.storage.local.set({ config: cfg }, res));
}
function getDay(key) {
  return new Promise(res => chrome.storage.local.get('day:' + key, r => res(r['day:' + key] || { domains: {}, videos: {} })));
}
function saveDay(key, data) {
  return new Promise(res => chrome.storage.local.set({ ['day:' + key]: data }, res));
}
