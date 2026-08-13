import React, { useState } from 'react';
import { Plus, Trash2, FileText } from 'lucide-react';
import { Note } from '../types';

interface NotesViewProps {
  notes: Note[];
  onAdd: () => Note;
  onUpdate: (id: string, patch: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({ notes, onAdd, onUpdate, onDelete }) => {
  const [selectedId, setSelectedId] = useState<string | null>(notes[0]?.id ?? null);
  const selected = notes.find(n => n.id === selectedId) || null;

  const handleAdd = () => { const n = onAdd(); setSelectedId(n.id); };
  const handleDelete = (id: string) => {
    onDelete(id);
    setSelectedId(prev => (prev === id ? (notes.find(n => n.id !== id)?.id ?? null) : prev));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="md:col-span-1 space-y-2">
        <button onClick={handleAdd} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-black text-sm font-bold hover:bg-zinc-200">
          <Plus size={16} /> New note
        </button>
        {notes.length === 0 ? (
          <p className="text-xs text-zinc-600 px-1 pt-2">No notes yet.</p>
        ) : (
          notes.map(n => (
            <button
              key={n.id}
              onClick={() => setSelectedId(n.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedId === n.id ? 'bg-surface border-border' : 'border-transparent hover:bg-surfaceHighlight/40'}`}
            >
              <div className="flex items-center gap-2 text-sm text-zinc-200 truncate">
                <FileText size={13} className="text-zinc-600 flex-shrink-0" />
                {n.title || 'Untitled note'}
              </div>
              <div className="text-[10px] text-zinc-600 mt-1 truncate">{n.content.slice(0, 40) || 'Empty'}</div>
            </button>
          ))
        )}
      </div>

      <div className="md:col-span-2">
        {selected ? (
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <input
                value={selected.title}
                onChange={e => onUpdate(selected.id, { title: e.target.value })}
                placeholder="Note title"
                className="flex-1 bg-transparent text-lg text-white font-medium placeholder-zinc-600 outline-none"
              />
              <button onClick={() => handleDelete(selected.id)} className="text-zinc-600 hover:text-red-400 p-1"><Trash2 size={16} /></button>
            </div>
            <textarea
              value={selected.content}
              onChange={e => onUpdate(selected.id, { content: e.target.value })}
              placeholder="Start typing…"
              rows={16}
              className="w-full bg-transparent text-sm text-zinc-300 placeholder-zinc-700 outline-none resize-none leading-relaxed"
            />
            <div className="text-[10px] text-zinc-600 mt-2">Edited {new Date(selected.updatedAt).toLocaleString()}</div>
          </div>
        ) : (
          <div className="text-center py-20 text-zinc-700 font-light border border-dashed border-border rounded-lg">
            Select a note, or create a new one.
          </div>
        )}
      </div>
    </div>
  );
};
