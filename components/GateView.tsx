import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, CheckSquare, Square, Play, Minus, Trophy, Loader2 } from 'lucide-react';
import { GateSubject } from '../types';
import { coverage, testProgress } from '../utils/gate';
import { thumbnailUrl, watchUrl, parsePlaylistId } from '../utils/youtube';

interface GateViewProps {
  gate: GateSubject[];
  onAddVideo: (subjectId: string, url: string) => boolean;
  onAddPlaylist: (subjectId: string, url: string) => Promise<{ added: number }>;
  onToggleVideo: (subjectId: string, videoId: string) => void;
  onDeleteVideo: (subjectId: string, videoId: string) => void;
  onSetTests: (subjectId: string, patch: { testsDone?: number; testsTarget?: number }) => void;
}

const Bar: React.FC<{ label: string; value: number; color: string; text: string }> = ({ label, value, color, text }) => (
  <div>
    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
      <span>{label}</span><span className="text-zinc-400">{text}</span>
    </div>
    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(value * 100)}%`, backgroundColor: color }} />
    </div>
  </div>
);

const SubjectRow: React.FC<{ subject: GateSubject } & Omit<GateViewProps, 'gate'>> = ({ subject: s, onAddVideo, onAddPlaylist, onToggleVideo, onDeleteVideo, onSetTests }) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const watched = s.videos.filter(v => v.done).length;

  const add = async () => {
    const u = url.trim();
    if (!u || busy) return;
    if (parsePlaylistId(u)) {
      setBusy(true); setErr(false); setMsg('Importing playlist…');
      try {
        const { added } = await onAddPlaylist(s.id, u);
        setUrl('');
        setMsg(added ? `Added ${added} video${added === 1 ? '' : 's'}.` : 'Those videos are already in the list.');
      } catch (e: any) {
        setErr(true); setMsg(e?.message || 'Failed to import playlist.');
      } finally { setBusy(false); }
    } else {
      const ok = onAddVideo(s.id, u);
      if (ok) { setUrl(''); setErr(false); setMsg(null); } else { setErr(true); setMsg(null); }
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 text-left">
        {open ? <ChevronDown size={16} className="text-zinc-500 flex-shrink-0" /> : <ChevronRight size={16} className="text-zinc-500 flex-shrink-0" />}
        <span className="text-sm text-white font-medium flex-1">{s.name}</span>
        <span className="text-[10px] text-zinc-600 font-mono">{watched}/{s.videos.length} · {s.testsDone}/{s.testsTarget}</span>
      </button>

      <div className="grid grid-cols-2 gap-4 mt-3">
        <Bar label="Coverage" value={coverage(s)} color="#22c55e" text={`${watched}/${s.videos.length}`} />
        <Bar label="Tests" value={testProgress(s)} color="#a855f7" text={`${s.testsDone}/${s.testsTarget}`} />
      </div>

      {open && (
        <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Tests controls */}
          <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
            <Trophy size={13} className="text-purple-400" />
            <span>Mock tests</span>
            <button onClick={() => onSetTests(s.id, { testsDone: s.testsDone - 1 })} className="p-1 rounded bg-surfaceHighlight hover:text-white"><Minus size={12} /></button>
            <span className="tabular-nums w-6 text-center text-zinc-200">{s.testsDone}</span>
            <button onClick={() => onSetTests(s.id, { testsDone: s.testsDone + 1 })} className="p-1 rounded bg-surfaceHighlight hover:text-white"><Plus size={12} /></button>
            <span className="text-zinc-600">/ target</span>
            <input type="number" min={1} value={s.testsTarget}
              onChange={e => onSetTests(s.id, { testsTarget: parseInt(e.target.value, 10) || 1 })}
              className="w-14 bg-surfaceHighlight border border-border rounded px-2 py-0.5 text-zinc-200 outline-none" />
          </div>

          {/* Playlist */}
          <div className="space-y-2">
            {s.videos.map(v => (
              <div key={v.id} className="flex items-center gap-3 group">
                <button onClick={() => onToggleVideo(s.id, v.id)} className="text-zinc-400 hover:text-white flex-shrink-0">
                  {v.done ? <CheckSquare size={16} className="text-emerald-500" /> : <Square size={16} />}
                </button>
                <a href={watchUrl(v.videoId)} target="_blank" rel="noopener noreferrer" className="relative w-16 aspect-video rounded overflow-hidden bg-black flex-shrink-0 group/thumb">
                  <img src={thumbnailUrl(v.videoId)} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/thumb:bg-black/40"><Play size={12} className="text-white" fill="white" /></span>
                </a>
                <span className={`text-xs flex-1 truncate ${v.done ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>{v.url}</span>
                <button onClick={() => onDeleteVideo(s.id, v.id)} className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>

          {/* Add video or playlist */}
          <div className="flex items-center gap-2">
            <input
              value={url}
              onChange={e => { setUrl(e.target.value); setErr(false); setMsg(null); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
              placeholder="Paste a YouTube video or playlist link…"
              disabled={busy}
              className={`flex-1 bg-surfaceHighlight border rounded px-2 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none disabled:opacity-50 ${err ? 'border-red-500/50' : 'border-border'}`}
            />
            <button onClick={add} disabled={busy} className="p-1.5 rounded bg-white text-black hover:bg-zinc-200 disabled:opacity-50">
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            </button>
          </div>
          {msg && <p className={`text-[10px] ${err ? 'text-red-400' : 'text-zinc-500'}`}>{msg}</p>}
        </div>
      )}
    </div>
  );
};

export const GateView: React.FC<GateViewProps> = ({ gate, ...handlers }) => {
  const totalVideos = gate.reduce((n, s) => n + s.videos.length, 0);
  const watched = gate.reduce((n, s) => n + s.videos.filter(v => v.done).length, 0);
  const testsDone = gate.reduce((n, s) => n + s.testsDone, 0);
  const testsTarget = gate.reduce((n, s) => n + s.testsTarget, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 gap-4">
        <Bar label="Overall syllabus coverage" value={totalVideos ? watched / totalVideos : 0} color="#22c55e" text={`${watched}/${totalVideos}`} />
        <Bar label="Overall tests" value={testsTarget ? testsDone / testsTarget : 0} color="#a855f7" text={`${testsDone}/${testsTarget}`} />
      </div>
      <div className="space-y-3">
        {gate.map(s => <SubjectRow key={s.id} subject={s} {...handlers} />)}
      </div>
      <p className="text-[10px] text-zinc-600">Add lecture videos per subject and tick them as you watch — coverage fills up. Log mock tests to fill the tests bar.</p>
    </div>
  );
};
