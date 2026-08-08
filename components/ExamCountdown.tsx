import React, { useMemo } from 'react';
import { CalendarClock } from 'lucide-react';
import { ExamEvent } from '../types';

interface ExamCountdownProps {
  examEvents: ExamEvent[];
}

const daysUntil = (dateStr: string): number => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
};

// Countdown chips for upcoming pinned exams, soonest first.
export const ExamCountdown: React.FC<ExamCountdownProps> = ({ examEvents }) => {
  const upcoming = useMemo(() =>
    examEvents
      .map(e => ({ ...e, days: daysUntil(e.date) }))
      .filter(e => e.days >= 0)
      .sort((a, b) => a.days - b.days)
      .slice(0, 4),
  [examEvents]);

  if (upcoming.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {upcoming.map(e => (
        <div key={e.id} className="bg-surface border border-border rounded-lg p-4 relative overflow-hidden">
          <div className="absolute top-3 right-3 w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-zinc-500 mb-2">
            <CalendarClock size={11} /> Exam
          </div>
          <div className="text-3xl font-light text-white leading-none">
            {e.days === 0 ? 'Today' : e.days}
            {e.days > 0 && <span className="text-xs text-zinc-500 ml-1">day{e.days === 1 ? '' : 's'}</span>}
          </div>
          <div className="text-xs text-zinc-400 mt-2 truncate" title={e.title}>{e.title}</div>
        </div>
      ))}
    </div>
  );
};
