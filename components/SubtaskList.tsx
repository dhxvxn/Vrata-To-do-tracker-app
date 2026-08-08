import React, { useState } from 'react';
import { CheckSquare, Square, X, Plus, ListChecks } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Task, SubTask } from '../types';

interface SubtaskListProps {
  task: Task;
  onUpdate: (subtasks: SubTask[]) => void;
}

// Inline checklist of subtasks for a task, with progress and an add field.
export const SubtaskList: React.FC<SubtaskListProps> = ({ task, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const subtasks = task.subtasks || [];
  const done = subtasks.filter(s => s.done).length;

  const add = () => {
    const title = input.trim();
    if (!title) return;
    onUpdate([...subtasks, { id: uuidv4(), title, done: false }]);
    setInput('');
  };
  const toggle = (id: string) => onUpdate(subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s));
  const remove = (id: string) => onUpdate(subtasks.filter(s => s.id !== id));

  return (
    <div className="ml-10 mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-zinc-500 hover:text-white"
      >
        <ListChecks size={12} /> {subtasks.length ? `Checklist ${done}/${subtasks.length}` : 'Add checklist'}
      </button>

      {subtasks.length > 0 && (
        <div className="mt-1.5 h-1 w-full max-w-xs bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(done / subtasks.length) * 100}%` }} />
        </div>
      )}

      {open && (
        <div className="mt-2 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
          {subtasks.map(s => (
            <div key={s.id} className="flex items-center gap-2 text-xs">
              <button onClick={() => toggle(s.id)} className="text-zinc-400 hover:text-white">
                {s.done ? <CheckSquare size={14} className="text-emerald-500" /> : <Square size={14} />}
              </button>
              <span className={s.done ? 'text-zinc-600 line-through' : 'text-zinc-300'}>{s.title}</span>
              <button onClick={() => remove(s.id)} className="text-zinc-700 hover:text-red-400 ml-auto"><X size={12} /></button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
              placeholder="Add a step…"
              className="flex-1 max-w-xs bg-surfaceHighlight border border-border rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-600 outline-none"
            />
            <button onClick={add} className="p-1.5 rounded bg-white text-black hover:bg-zinc-200"><Plus size={13} /></button>
          </div>
        </div>
      )}
    </div>
  );
};
