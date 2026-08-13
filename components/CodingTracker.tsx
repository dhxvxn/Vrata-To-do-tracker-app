import React, { useCallback, useEffect, useState } from 'react';
import { Github, Code2, RefreshCw, Flame, AlertCircle, ExternalLink } from 'lucide-react';
import { Settings } from '../types';
import { fetchGithubStats, fetchLeetcodeStats, extractGithubUser, extractLeetcodeUser, GithubStats, LeetcodeStats } from '../services/codingService';

interface CodingTrackerProps {
  settings: Settings;
  onUpdateSettings: (patch: Partial<Settings>) => void;
}

const cellColor = (count: number): string => {
  if (count <= 0) return '#18181b';
  if (count === 1) return '#14532d';
  if (count <= 3) return '#16a34a';
  if (count <= 5) return '#22c55e';
  return '#4ade80';
};

export const CodingTracker: React.FC<CodingTrackerProps> = ({ settings, onUpdateSettings }) => {
  const [gh, setGh] = useState(settings.githubUser || '');
  const [lc, setLc] = useState(settings.leetcodeUser || '');
  const [ghStats, setGhStats] = useState<GithubStats | null>(null);
  const [lcStats, setLcStats] = useState<LeetcodeStats | null>(null);
  const [ghErr, setGhErr] = useState<string | null>(null);
  const [lcErr, setLcErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (ghUser: string, lcUser: string) => {
    setLoading(true); setGhErr(null); setLcErr(null);
    await Promise.all([
      ghUser.trim()
        ? fetchGithubStats(ghUser).then(setGhStats).catch(e => { setGhStats(null); setGhErr(e.message); })
        : Promise.resolve(setGhStats(null)),
      lcUser.trim()
        ? fetchLeetcodeStats(lcUser).then(setLcStats).catch(e => { setLcStats(null); setLcErr(e.message); })
        : Promise.resolve(setLcStats(null)),
    ]);
    setLoading(false);
  }, []);

  // Auto-load saved usernames on first mount.
  useEffect(() => {
    if (settings.githubUser || settings.leetcodeUser) load(settings.githubUser || '', settings.leetcodeUser || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    const ghClean = extractGithubUser(gh);
    const lcClean = extractLeetcodeUser(lc);
    setGh(ghClean);
    setLc(lcClean);
    onUpdateSettings({ githubUser: ghClean || undefined, leetcodeUser: lcClean || undefined });
    load(ghClean, lcClean);
  };

  const recent = ghStats ? ghStats.cells.slice(-119) : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center bg-surface border border-border rounded-lg overflow-hidden">
          <span className="pl-3 text-zinc-600"><Github size={16} /></span>
          <input value={gh} onChange={e => setGh(e.target.value)} placeholder="GitHub username or profile link"
            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none" />
        </div>
        <div className="flex-1 flex items-center bg-surface border border-border rounded-lg overflow-hidden">
          <span className="pl-3 text-zinc-600"><Code2 size={16} /></span>
          <input value={lc} onChange={e => setLc(e.target.value)} placeholder="LeetCode username or profile link"
            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none" />
        </div>
        <button onClick={save} disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-sm font-bold hover:bg-zinc-200 disabled:opacity-50">
          {loading ? <RefreshCw size={15} className="animate-spin" /> : <RefreshCw size={15} />} Load
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GitHub card */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Github size={18} className="text-white" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">GitHub</h3>
          </div>
          {ghErr ? (
            <div className="flex items-start gap-2 text-xs text-red-400"><AlertCircle size={14} className="mt-0.5" />{ghErr}</div>
          ) : ghStats ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <img src={ghStats.avatar} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                <div className="min-w-0">
                  <a href={ghStats.url} target="_blank" rel="noopener noreferrer" className="text-sm text-white font-medium flex items-center gap-1 hover:underline">
                    {ghStats.name || ghStats.login} <ExternalLink size={11} />
                  </a>
                  <div className="text-[11px] text-zinc-500">{ghStats.repos} repos · {ghStats.followers} followers</div>
                </div>
              </div>
              <div className="flex gap-4 mb-4">
                <div><div className="text-2xl font-light text-white">{ghStats.totalContributions}</div><div className="text-[10px] uppercase tracking-widest text-zinc-500">Contributions (yr)</div></div>
                <div><div className="text-2xl font-light text-white flex items-center gap-1"><Flame size={16} className="text-orange-400" fill="#fb923c" />{ghStats.streak}</div><div className="text-[10px] uppercase tracking-widest text-zinc-500">Day streak</div></div>
              </div>
              {recent.length > 0 && (
                <div className="overflow-x-auto">
                  <div className="grid grid-flow-col gap-[3px]" style={{ gridTemplateRows: 'repeat(7, 9px)', gridAutoColumns: '9px' }}>
                    {recent.map((c, i) => (
                      <div key={i} title={`${c.date}: ${c.count}`} className="w-[9px] h-[9px] rounded-[2px]" style={{ backgroundColor: cellColor(c.count) }} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-zinc-600">Enter your GitHub username to see your contributions.</p>
          )}
        </div>

        {/* LeetCode card */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Code2 size={18} className="text-yellow-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">LeetCode</h3>
          </div>
          {lcErr ? (
            <div className="flex items-start gap-2 text-xs text-red-400"><AlertCircle size={14} className="mt-0.5" />{lcErr}</div>
          ) : lcStats ? (
            <>
              <div className="text-4xl font-light text-white mb-4">{lcStats.total}<span className="text-sm text-zinc-500 ml-2">solved</span></div>
              {([['Easy', lcStats.easy, '#22c55e'], ['Medium', lcStats.medium, '#f59e0b'], ['Hard', lcStats.hard, '#ef4444']] as [string, number, string][]).map(([label, val, color]) => (
                <div key={label} className="flex items-center gap-3 mb-2">
                  <span className="text-xs w-14" style={{ color }}>{label}</span>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (val / Math.max(lcStats.total, 1)) * 100)}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-xs text-zinc-400 tabular-nums w-8 text-right">{val}</span>
                </div>
              ))}
            </>
          ) : (
            <p className="text-xs text-zinc-600">Enter your LeetCode username to see solved problems.</p>
          )}
        </div>
      </div>
      <p className="text-[10px] text-zinc-600">Data from public GitHub &amp; LeetCode APIs. Usernames are saved to your synced settings.</p>
    </div>
  );
};
