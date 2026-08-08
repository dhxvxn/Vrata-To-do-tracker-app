
import React, { useState } from 'react';
import { Plus, AlignLeft, Youtube } from 'lucide-react';
import { TaskFrequency, TaskExtras } from '../types';
import { parseYouTubeId } from '../utils/youtube';

interface TaskInputProps {
  onAdd: (title: string, frequency: TaskFrequency, details?: string, extras?: TaskExtras) => void;
  selectedFrequency: TaskFrequency;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAdd, selectedFrequency }) => {
  const [text, setText] = useState('');
  const [details, setDetails] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const isStudy = selectedFrequency === TaskFrequency.STUDY;
  const youtubeInvalid = isStudy && youtubeUrl.trim().length > 0 && !parseYouTubeId(youtubeUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || youtubeInvalid) return;
    const extras: TaskExtras | undefined =
      isStudy && youtubeUrl.trim() ? { youtubeUrl: youtubeUrl.trim() } : undefined;
    onAdd(text, selectedFrequency, details.trim() || undefined, extras);
    setText('');
    setDetails('');
    setYoutubeUrl('');
    if (selectedFrequency !== TaskFrequency.RUNNING) setShowDetails(false);
  };

  const getPlaceholder = () => {
    switch (selectedFrequency) {
      case TaskFrequency.EXAM: return "Add study goal...";
      case TaskFrequency.RUNNING: return "Run title (e.g. 5km Easy)...";
      case TaskFrequency.DAILY: return "Main focus today?";
      case TaskFrequency.WEEKLY: return "Weekly milestone...";
      case TaskFrequency.MONTHLY: return "Big picture objective...";
      case TaskFrequency.STUDY: return "What are you studying? (e.g. Calculus – Limits)";
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
          disabled={!text.trim() || youtubeInvalid}
        >
          <Plus size={20} />
        </button>
      </div>

      {isStudy && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <div className={`flex items-center bg-surface border rounded-lg overflow-hidden transition-colors ${youtubeInvalid ? 'border-red-500/50' : 'border-border focus-within:border-textMuted'}`}>
            <span className="pl-3 text-zinc-600"><Youtube size={18} /></span>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Paste a YouTube link (optional)"
              className="flex-1 bg-transparent border-none text-textMain px-3 py-2.5 focus:ring-0 placeholder-zinc-600 outline-none text-xs sm:text-sm"
            />
          </div>
          {youtubeInvalid && <p className="text-[10px] text-red-400 mt-1 px-1">That doesn't look like a valid YouTube link.</p>}
        </div>
      )}

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
