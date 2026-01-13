
import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, AlignLeft } from 'lucide-react';
import { TaskFrequency } from '../types';

interface TaskInputProps {
  onAdd: (title: string, frequency: TaskFrequency, details?: string) => void;
  selectedFrequency: TaskFrequency;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAdd, selectedFrequency }) => {
  const [text, setText] = useState('');
  const [details, setDetails] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text, selectedFrequency, details.trim() || undefined);
      setText('');
      setDetails('');
      if (selectedFrequency !== TaskFrequency.RUNNING) setShowDetails(false);
    }
  };

  const getPlaceholder = () => {
    switch (selectedFrequency) {
      case TaskFrequency.EXAM: return "Add study goal...";
      case TaskFrequency.RUNNING: return "Run title (e.g. 5km Easy)...";
      case TaskFrequency.DAILY: return "Main focus today?";
      case TaskFrequency.WEEKLY: return "Weekly milestone...";
      case TaskFrequency.MONTHLY: return "Big picture objective...";
      default: return "Add task...";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 animate-in fade-in duration-300">
      <div className="flex items-center bg-surface border border-border rounded-lg overflow-hidden focus-within:border-textMuted transition-colors duration-200">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={getPlaceholder()}
          className="flex-1 bg-transparent border-none text-textMain px-4 py-3 focus:ring-0 placeholder-zinc-600 outline-none text-sm sm:text-base"
        />
        
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className={`p-3 transition-colors ${showDetails || details ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
          title="Add details/bullet points"
        >
          <AlignLeft size={18} />
        </button>

        <button
          type="submit"
          className="p-3 text-zinc-500 hover:text-white transition-colors disabled:opacity-30"
          disabled={!text.trim()}
        >
          <Plus size={20} />
        </button>
      </div>

      {(showDetails || selectedFrequency === TaskFrequency.RUNNING) && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Add details... (Press Enter for new bullet point)"
            rows={3}
            className="w-full bg-surface border border-border rounded-lg text-textMain px-4 py-3 focus:ring-0 focus:border-zinc-700 placeholder-zinc-700 outline-none text-xs sm:text-sm resize-none"
          />
          <p className="text-[10px] text-zinc-600 mt-1 px-1">Details will be formatted as bullet points.</p>
        </div>
      )}
    </form>
  );
};
