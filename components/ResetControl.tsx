import React, { useState } from 'react';
import { RotateCcw, X, AlertTriangle } from 'lucide-react';

interface ResetControlProps {
  onResetStreak: () => void;
  onResetTasks: () => void;
  onResetAll: () => void;
}

interface Action { key: string; label: string; desc: string; run: () => void; danger?: boolean; }

export const ResetControl: React.FC<ResetControlProps> = ({ onResetStreak, onResetTasks, onResetAll }) => {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const actions: Action[] = [
    { key: 'streak', label: 'Reset streak', desc: 'Un-complete every task and clear completion history (tasks are kept).', run: onResetStreak },
    { key: 'tasks', label: 'Delete all tasks', desc: 'Permanently remove every task. Exams, notes and goals are kept.', run: onResetTasks, danger: true },
    { key: 'all', label: 'Reset everything', desc: 'Wipe all tasks, exams, focus sessions, notes and goals.', run: onResetAll, danger: true },
  ];

  const close = () => { setOpen(false); setConfirm(null); };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-zinc-600 hover:text-red-400 transition-colors"
      >
        <RotateCcw size={13} /> Reset data
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4" onClick={close}>
          <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2"><AlertTriangle size={15} className="text-amber-400" /> Reset data</h3>
              <button onClick={close} className="text-zinc-600 hover:text-white p-1"><X size={16} /></button>
            </div>
            <div className="space-y-2">
              {actions.map(a => (
                <div key={a.key} className="border border-border rounded-lg p-3">
                  <div className="text-sm text-zinc-200 font-medium">{a.label}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{a.desc}</div>
                  {confirm === a.key ? (
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => { a.run(); close(); }} className="flex-1 py-1.5 rounded bg-red-500 text-white text-xs font-bold hover:bg-red-600">Yes, do it</button>
                      <button onClick={() => setConfirm(null)} className="flex-1 py-1.5 rounded border border-border text-zinc-400 text-xs hover:text-white">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirm(a.key)} className={`mt-2 text-xs font-bold uppercase tracking-wider ${a.danger ? 'text-red-400' : 'text-amber-400'} hover:underline`}>
                      {a.label} →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
