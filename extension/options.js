const parse = s => s.split(/[\n,]+/).map(x => x.trim().toLowerCase()).filter(Boolean);

async function load() {
  const cfg = await getConfig();
  document.getElementById('study').value = cfg.studyDomains.join('\n');
  document.getElementById('distraction').value = cfg.distractionDomains.join('\n');
  document.getElementById('keywords').value = cfg.studyKeywords.join('\n');
}

document.getElementById('save').addEventListener('click', async () => {
  const cfg = await getConfig();
  cfg.studyDomains = parse(document.getElementById('study').value);
  cfg.distractionDomains = parse(document.getElementById('distraction').value);
  cfg.studyKeywords = parse(document.getElementById('keywords').value);
  await saveConfig(cfg);
  const s = document.getElementById('saved');
  s.style.display = 'inline';
  setTimeout(() => { s.style.display = 'none'; }, 1800);
});

load();
