function fmt(sec) {
  const m = Math.round(sec / 60);
  if (m < 60) return m + 'm';
  return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
}
function esc(s) { return (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

async function render() {
  const cfg = await getConfig();
  const day = await getDay(todayKey());
  const app = document.getElementById('app');

  let productive = 0, distraction = 0;
  const siteList = [];
  for (const [dom, sec] of Object.entries(day.domains || {})) {
    if (dom.includes('youtube.com')) { siteList.push([dom, sec, 'yt']); continue; }
    const c = classifyDomain(dom, cfg);
    if (c === 'study') productive += sec;
    else if (c === 'distraction') distraction += sec;
    siteList.push([dom, sec, c]);
  }
  const videos = Object.entries(day.videos || {}).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.seconds - a.seconds);
  for (const v of videos) { if (v.productive) productive += v.seconds; else distraction += v.seconds; }

  const total = productive + distraction;
  const score = total > 0 ? Math.round((productive / total) * 100) : null;

  siteList.sort((a, b) => b[1] - a[1]);
  const topSites = siteList.filter(s => s[1] >= 30).slice(0, 6);

  const color = c => c === 'study' ? '#22c55e' : c === 'distraction' ? '#ef4444' : c === 'yt' ? '#eab308' : '#52525b';

  let html = '';
  html += '<div class="sub">Focus score · today</div>';
  html += '<div class="score">' + (score === null ? '—' : score + '<span style="font-size:16px;color:#52525b">%</span>') + '</div>';
  html += '<div class="row">';
  html += '<div class="card"><div class="n green">' + fmt(productive) + '</div><div class="l">Productive</div></div>';
  html += '<div class="card"><div class="n red">' + fmt(distraction) + '</div><div class="l">Distraction</div></div>';
  html += '</div>';

  html += '<h2>Top sites today</h2>';
  if (topSites.length === 0) html += '<p class="empty">No activity tracked yet — keep browsing.</p>';
  topSites.forEach(([dom, sec, c]) => {
    html += '<div class="item"><span class="g" style="background:' + color(c) + '"></span><span class="t">' + esc(dom) + '</span><span class="v">' + fmt(sec) + '</span></div>';
  });

  html += '<h2>YouTube today</h2>';
  if (videos.length === 0) html += '<p class="empty">No YouTube videos watched yet.</p>';
  videos.slice(0, 6).forEach(v => {
    const badge = v.gateRelated ? '<span class="badge b-gate">GATE</span>' : v.productive ? '<span class="badge b-study">Study</span>' : '<span class="badge b-off">Off-topic</span>';
    html += '<div class="item"><span class="t" title="' + esc(v.title) + '">' + esc(v.title || '(video)') + '</span>' + badge + '<span class="v">' + fmt(v.seconds) + '</span></div>';
  });

  app.innerHTML = html;
}

document.getElementById('opt').addEventListener('click', e => { e.preventDefault(); chrome.runtime.openOptionsPage(); });
render();
