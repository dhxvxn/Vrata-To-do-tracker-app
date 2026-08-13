
import React, { useMemo, useRef, useState } from 'react';
import { Plus, AlignLeft, Youtube, Mic, X, Bell } from 'lucide-react';
import { TaskFrequency, TaskExtras, Priority } from '../types';
import { parseYouTubeId } from '../utils/youtube';
import { createRecognition, isSpeechRecognitionSupported, RecognitionController } from '../services/voiceService';
import { requestPermission, notificationsSupported } from '../services/notificationService';

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: '#3b82f6' },
  { value: 'MEDIUM', label: 'Med', color: '#f59e0b' },
  { value: 'HIGH', label: 'High', color: '#ef4444' },
];

interface TaskInputProps {
  onAdd: (title: string, frequency: TaskFrequency, details?: string, extras?: TaskExtras) => void;
  selectedFrequency: TaskFrequency;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAdd, selectedFrequency }) => {
  const [text, setText] = useState('');
  const [details, setDetails] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [priority, setPriority] = useState<Priority | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [showReminder, setShowReminder] = useState(false);
  const [listening, setListening] = useState(false);
  const controllerRef = useRef<RecognitionController | null>(null);
  const voiceSupportedReminders = notificationsSupported();

  const addTag = (raw: string) => {
    const t = raw.trim().replace(/,$/, '');
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const voiceSupported = useMemo(() => isSpeechRecognitionSupported(), []);

  const isStudy = selectedFrequency === TaskFrequency.STUDY;
  const youtubeInvalid = isStudy && youtubeUrl.trim().length > 0 && !parseYouTubeId(youtubeUrl);

  // Dictate speech straight into the title field — pure browser speech-to-text.
  const toggleDictation = () => {
    if (listening) { controllerRef.current?.stop(); setListening(false); return; }
    const controller = createRecognition({
      onResult: (transcript) => setText(prev => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript)),
      onError: () => setListening(false),
      onEnd: () => setListening(false),
    });
    controllerRef.current = controller;
    if (controller) { setListening(true); controller.start(); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || youtubeInvalid) return;
    const extras: TaskExtras = {
      ...(isStudy && youtubeUrl.trim() ? { youtubeUrl: youtubeUrl.trim() } : {}),
      ...(priority ? { priority } : {}),
      ...(tags.length ? { tags } : {}),
      ...(remindAt ? { remindAt: new Date(remindAt).toISOString() } : {}),
    };
    onAdd(text, selectedFrequency, details.trim() || undefined, Object.keys(extras).length ? extras : undefined);
    setText('');
    setDetails('');
    setYoutubeUrl('');
    setPriority(undefined);
    setTags([]);
    setTagInput('');
    setRemindAt('');
    setShowReminder(false);
    if (selectedFrequency !== TaskFrequency.FITNESS) setShowDetails(false);
  };

  const getPlaceholder = () => {
    switch (selectedFrequency) {
      case TaskFrequency.EXAM: return "Add study goal...";
      case TaskFrequency.FITNESS: return "Activity title (e.g. Back Day, 10k Tempo)...";
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
          onClick={toggleDictation}
          disabled={!voiceSupported}
          className={`p-3 transition-colors ${
            !voiceSupported
              ? 'text-zinc-700 cursor-not-allowed'
              : listening
                ? 'text-red-500 animate-pulse'
                : 'text-zinc-400 hover:text-white'
          }`}
          title={
            !voiceSupported
              ? 'Voice input works in Chrome or Edge'
              : listening
                ? 'Listening… tap to stop'
                : 'Add a task by voice'
          }
        >
          <Mic size={18} />
        </button>

        {voiceSupportedReminders && (
          <button
            type="button"
            onClick={() => { const next = !showReminder; setShowReminder(next); if (next) requestPermission(); }}
            className={`p-3 transition-colors ${showReminder || remindAt ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
            title="Set a reminder"
          >
            <Bell size={18} />
          </button>
        )}

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

      {voiceSupported && (
        listening ? (
          <p className="flex items-center gap-2 text-[11px] text-red-400 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Listening… speak your task now.
          </p>
        ) : (
          <p className="text-[11px] text-zinc-600 px-1">🎤 Tap the mic to add a task by voice.</p>
        )
      )}

      <div className="flex flex-wrap items-center gap-2 px-1">
        <div className="flex items-center gap-1">
          {PRIORITIES.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(priority === p.value ? undefined : p.value)}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-all ${priority === p.value ? 'text-black' : 'text-zinc-500 border-border hover:text-white'}`}
              style={priority === p.value ? { backgroundColor: p.color, borderColor: p.color } : undefined}
            >
              {p.label}
            </button>
          ))}
        </div>
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 px-2 py-1 rounded bg-surfaceHighlight text-[10px] text-zinc-300 border border-border">
            #{t}
            <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== t))} className="text-zinc-600 hover:text-red-400"><X size={10} /></button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); } }}
          onBlur={() => tagInput.trim() && addTag(tagInput)}
          placeholder="+ tag"
          className="w-16 bg-transparent text-[11px] text-zinc-300 placeholder-zinc-700 outline-none"
        />
      </div>

      {showReminder && (
        <div className="animate-in slide-in-from-top-2 duration-300 flex items-center gap-2">
          <Bell size={14} className="text-zinc-500" />
          <input
            type="datetime-local"
            value={remindAt}
            onChange={e => setRemindAt(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-textMuted"
          />
          {remindAt && <button type="button" onClick={() => setRemindAt('')} className="text-zinc-600 hover:text-red-400"><X size={14} /></button>}
        </div>
      )}

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

      {(showDetails || selectedFrequency === TaskFrequency.FITNESS) && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Add specific exercises or split details... (New lines for bullets)"
            rows={3}
            className="w-full bg-surface border border-border rounded-lg text-textMain px-4 py-3 focus:ring-0 focus:border-zinc-700 placeholder-zinc-700 outline-none text-xs sm:text-sm resize-none"
          />
          <p className="text-[10px] text-zinc-600 mt-1 px-1">Details formatted as bullet points.</p>
        </div>
      )}
    </form>
  );
};
