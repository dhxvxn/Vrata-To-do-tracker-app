import React, { useState } from 'react';
import { Dumbbell, Plus, X } from 'lucide-react';
import { Task, WorkoutSet } from '../types';

interface WorkoutLogProps {
  task: Task;
  onUpdate: (sets: WorkoutSet[]) => void;
}

// Inline set/rep/weight logger for a FITNESS task, with total volume.
export const WorkoutLog: React.FC<WorkoutLogProps> = ({ task, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const sets = task.sets || [];
  const volume = sets.reduce((sum, s) => sum + s.reps * s.weight, 0);

  const addSet = () => {
    const r = parseInt(reps, 10);
    const w = parseFloat(weight);
    if (!r || Number.isNaN(w)) return;
    onUpdate([...sets, { reps: r, weight: w }]);
    setReps(''); setWeight('');
  };

  const removeSet = (idx: number) => onUpdate(sets.filter((_, i) => i !== idx));

  return (
    <div className="ml-10 mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-zinc-500 hover:text-white"
      >
        <Dumbbell size={12} /> {sets.length ? `${sets.length} sets · ${volume} kg vol` : 'Log sets'}
      </button>

      {open && (
        <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {sets.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-zinc-300">
              <span className="text-zinc-600 w-5">{i + 1}.</span>
              <span className="tabular-nums">{s.reps} reps × {s.weight} kg</span>
              <button onClick={() => removeSet(i)} className="text-zinc-700 hover:text-red-400 ml-1"><X size={12} /></button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input type="number" inputMode="numeric" value={reps} onChange={e => setReps(e.target.value)} placeholder="reps"
              className="w-16 bg-surfaceHighlight border border-border rounded px-2 py-1 text-xs text-zinc-200 outline-none" />
            <span className="text-zinc-600 text-xs">×</span>
            <input type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder="kg"
              className="w-16 bg-surfaceHighlight border border-border rounded px-2 py-1 text-xs text-zinc-200 outline-none" />
            <button onClick={addSet} className="p-1.5 rounded bg-white text-black hover:bg-zinc-200"><Plus size={13} /></button>
          </div>
        </div>
      )}
    </div>
  );
};
