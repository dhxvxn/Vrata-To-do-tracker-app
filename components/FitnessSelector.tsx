
import React from 'react';
import { FitnessType } from '../types';

interface FitnessSelectorProps {
  selectedDay: number; // 0-6 (Sun-Sat)
  onSelectDay: (day: number) => void;
  selectedType: FitnessType;
  onSelectType: (type: FitnessType) => void;
}

export const FITNESS_TYPES: { type: FitnessType; label: string; color: string; group: string }[] = [
  { type: 'TEMPO', label: 'Tempo', color: '#ef4444', group: 'RUN' },
  { type: 'INTERVAL', label: 'Interval', color: '#a855f7', group: 'RUN' },
  { type: 'LONG', label: 'Long Run', color: '#3b82f6', group: 'RUN' },
  { type: 'EASY_RECOVERY', label: 'Easy/Recovery', color: '#22c55e', group: 'RUN' },
  { type: 'UPPER_BODY', label: 'Upper Body', color: '#06b6d4', group: 'GYM' },
  { type: 'LOWER_BODY', label: 'Lower Body', color: '#6366f1', group: 'GYM' },
  { type: 'CORE_ABS', label: 'Core & Abs', color: '#f43f5e', group: 'GYM' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const FitnessSelector: React.FC<FitnessSelectorProps> = ({ 
  selectedDay, 
  onSelectDay, 
  selectedType, 
  onSelectType 
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex flex-wrap gap-2">
        {DAYS.map((day, index) => {
          const dayIndex = (index + 1) % 7; 
          const isSelected = selectedDay === dayIndex;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(dayIndex)}
              className={`flex-1 min-w-[60px] py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
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

      <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
        <div>
          <h4 className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mb-3">Running</h4>
          <div className="flex flex-wrap gap-2">
            {FITNESS_TYPES.filter(t => t.group === 'RUN').map((rt) => (
              <button
                key={rt.type}
                type="button"
                onClick={() => onSelectType(rt.type)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-[10px] uppercase font-bold tracking-tight transition-all border ${
                  selectedType === rt.type 
                    ? 'border-white text-white' 
                    : 'border-transparent text-textMuted hover:text-white'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rt.color }} />
                {rt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mb-3">Gym</h4>
          <div className="flex flex-wrap gap-2">
            {FITNESS_TYPES.filter(t => t.group === 'GYM').map((rt) => (
              <button
                key={rt.type}
                type="button"
                onClick={() => onSelectType(rt.type)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-[10px] uppercase font-bold tracking-tight transition-all border ${
                  selectedType === rt.type 
                    ? 'border-white text-white' 
                    : 'border-transparent text-textMuted hover:text-white'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rt.color }} />
                {rt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
