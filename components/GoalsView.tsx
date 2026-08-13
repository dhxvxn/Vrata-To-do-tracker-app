import React, { useState } from 'react';
import { Plus, Trash2, Target, CheckSquare, Square, X, Flag } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Goal, SubTask } from '../types';

interface GoalsViewProps {
  goals: Goal[];
  onAdd: (title: string, description?: string, targetDate?: string) => Goal;
  onUpdate: (id: string, patch: Partial<Goal>) => void;
  onDelete: (id: string) => void;
}

const daysUntil = (dateStr: string): number => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${dateStr}T00:00:00`).getTime() - today.getTime()) / 86_400_000);
};

const GoalCard: React.FC<{ goal: Goal; onUpdate: GoalsViewProps['onUpdate']; onDelete: GoalsViewProps['onDelete'] }> = ({ goal, onUpdate, onDelete }) => {
  const [milestoneInput, setMilestoneInput] = useState('');
  const done = goal.milestones.filter(m => m.done).length;
  const pct = goal.milestones.length ? Math.round((done / goal.milestones.length) * 100) : 0;
  const days = goal.targetDate ? daysUntil(goal.targetDate) : null;

  const setMilestones = (milestones: SubTask[]) => onUpdate(goal.id, { milestones });
  const addMilestone = () => {
    const title = milestoneInput.trim();
    if (!title) return;
    setMilestones([...goal.milestones, { id: uuidv4(), title, done: false }]);
    setMilestoneInput('');
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-white flex-shrink-0" />
            <h3 className="text-base text-white font-medium truncate">{goal.title}</h3>
          </div>
          {goal.description && <p className="text-xs text-zinc-500 mt-1">{goal.description}</p>}
        </div>
        <button onClick={() => onDelete(goal.id)} className="text-zinc-600 hover:text-red-400 p-1"><Trash2 size={15} /></button>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-zinc-400 tabular-nums">{pct}%</span>
      </div>

      {days !== null && (
        <div className="mt-2 text-[11px] text-zinc-500 flex items-center gap-1.5">
          <Flag size={11} />
          {days < 0 ? 'Target date passed' : days === 0 ? 'Target: today' : `${days} day${days === 1 ? '' : 's'} to target`}
        </div>
      )}

      <div className="mt-4 space-y-1.5">
        {goal.milestones.map(m => (
          <div key={m.id} className="flex items-center gap-2 text-sm">
            <button onClick={() => setMilestones(goal.milestones.map(x => x.id === m.id ? { ...x, done: !x.done } : x))} className="text-zinc-400 hover:text-white">
              {m.done ? <CheckSquare size={15} className="text-emerald-500" /> : <Square size={15} />}
            </button>
            <span className={m.done ? 'text-zinc-600 line-through' : 'text-zinc-300'}>{m.title}</span>
            <button onClick={() => setMilestones(goal.milestones.filter(x => x.id !== m.id))} className="text-zinc-700 hover:text-red-400 ml-auto"><X size={12} /></button>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1">
          <input
            value={milestoneInput}
            onChange={e => setMilestoneInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMilestone(); } }}
            placeholder="Add a milestone…"
            className="flex-1 bg-surfaceHighlight border border-border rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-600 outline-none"
          />
          <button onClick={addMilestone} className="p-1.5 rounded bg-white text-black hover:bg-zinc-200"><Plus size={13} /></button>
        </div>
      </div>
    </div>
  );
};

export const GoalsView: React.FC<GoalsViewProps> = ({ goals, onAdd, onUpdate, onDelete }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const create = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), undefined, date || undefined);
    setTitle(''); setDate('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') create(); }}
          placeholder="New goal (e.g. Master Data Structures)"
          className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-textMuted" />
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-zinc-400 outline-none" />
        <button onClick={create} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-sm font-bold hover:bg-zinc-200"><Plus size={16} /> Add</button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-20 text-zinc-700 font-light border border-dashed border-border rounded-lg">
          No goals yet. Define one above and break it into milestones.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map(g => <GoalCard key={g.id} goal={g} onUpdate={onUpdate} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
};
