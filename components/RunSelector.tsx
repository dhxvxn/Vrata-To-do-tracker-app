
import React from 'react';
import { RunType } from '../types';

interface RunSelectorProps {
  selectedDay: number; // 0-6 (Sun-Sat)
  onSelectDay: (day: number) => void;
  selectedRunType: RunType;
  onSelectRunType: (type: RunType) => void;
}

const RUN_TYPES: { type: RunType; label: string; color: string }[] = [
  { type: 'NONE', label: 'General', color: '#71717a' },
  { type: 'TEMPO', label: 'Tempo', color: '#ef4444' },
  { type: 'INTERVAL', label: 'Interval', color: '#a855f7' },
  { type: 'LONG', label: 'Long Run', color: '#3b82f6' },
  { type: 'EASY', label: 'Easy Run', color: '#22c55e' },
  { type: 'RECOVERY', label: 'Recovery', color: '#f59e0b' },
  { type: 'REST', label: 'Rest Day', color: '#ec4899' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const RunSelector: React.FC<RunSelectorProps> = ({ 
  selectedDay, 
  onSelectDay, 
  selectedRunType, 
  onSelectRunType 
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex flex-wrap gap-2">
        {DAYS.map((day, index) => {
          const dayIndex = (index + 1) % 7; // Adjust to match JS Date.getDay() (0=Sun)
          const isSelected = selectedDay === dayIndex;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(dayIndex)}
              className={`flex-1 min-w-[60px] py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${
                isSelected 
                  ? 'bg-white text-black border-white' 
                  : 'bg-surfaceHighlight/30 text-textMuted border-border hover:border-zinc-500'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="bg-surface border border-border rounded-xl p-4">
        <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-4">Run Intensity</h4>
        <div className="flex flex-wrap gap-3">
          {RUN_TYPES.map((rt) => (
            <button
              key={rt.type}
              type="button"
              onClick={() => onSelectRunType(rt.type)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all border ${
                selectedRunType === rt.type 
                  ? 'border-white text-white' 
                  : 'border-transparent text-textMuted hover:text-white'
              }`}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: rt.color }} />
              {rt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
