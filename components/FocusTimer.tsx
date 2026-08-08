import React, { useEffect, useRef, useState } from 'react';
import { Timer, Play, Pause, RotateCcw, SkipForward, X } from 'lucide-react';

interface FocusTimerProps {
  studyTasks: { id: string; title: string }[];
  onLogSession: (minutes: number, taskId?: string, label?: string) => void;
}

const WORK_MIN = 25;
const BREAK_MIN = 5;

// A floating Pomodoro timer. Completing a focus block logs a focus session.
export const FocusTimer: React.FC<FocusTimerProps> = ({ studyTasks, onLogSession }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [secondsLeft, setSecondsLeft] = useState(WORK_MIN * 60);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [taskId, setTaskId] = useState<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = (mode === 'work' ? WORK_MIN : BREAK_MIN) * 60;

  const switchMode = (next: 'work' | 'break') => {
    setMode(next);
    setSecondsLeft((next === 'work' ? WORK_MIN : BREAK_MIN) * 60);
  };

  // On a completed work block: log the session and move to a break.
  const finishBlock = () => {
    setRunning(false);
    if (mode === 'work') {
      setCompleted(c => c + 1);
      const task = studyTasks.find(t => t.id === taskId);
      onLogSession(WORK_MIN, taskId || undefined, task?.title);
      switchMode('break');
    } else {
      switchMode('work');
    }
  };

  useEffect(() => {
    if (!running) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { finishBlock(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const pct = ((total - secondsLeft) / total) * 100;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-72 bg-surface border border-border rounded-xl shadow-2xl p-5 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
              <Timer size={15} /> {mode === 'work' ? 'Focus' : 'Break'}
            </span>
            <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-white p-1"><X size={15} /></button>
          </div>

          <div className="text-center">
            <div className="text-5xl font-light text-white tabular-nums tracking-tight">{mm}:{ss}</div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mt-4">
              <div className={`h-full rounded-full transition-all ${mode === 'work' ? 'bg-white' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          {studyTasks.length > 0 && (
            <select
              value={taskId}
              onChange={e => setTaskId(e.target.value)}
              className="w-full mt-4 bg-surfaceHighlight border border-border rounded-lg text-xs text-zinc-300 px-3 py-2 outline-none"
            >
              <option value="">General focus</option>
              {studyTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          )}

          <div className="flex items-center gap-2 mt-4">
            <button onClick={() => setRunning(r => !r)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200">
              {running ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Start</>}
            </button>
            <button onClick={() => { setRunning(false); switchMode(mode); }} title="Reset" className="p-2.5 rounded-lg border border-border text-zinc-400 hover:text-white"><RotateCcw size={15} /></button>
            <button onClick={finishBlock} title="Skip" className="p-2.5 rounded-lg border border-border text-zinc-400 hover:text-white"><SkipForward size={15} /></button>
          </div>
          <p className="text-[10px] text-zinc-600 mt-3 text-center">{completed} focus block{completed === 1 ? '' : 's'} today</p>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        title="Focus timer"
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${running ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:scale-105'}`}
      >
        <Timer size={22} />
      </button>
    </div>
  );
};
