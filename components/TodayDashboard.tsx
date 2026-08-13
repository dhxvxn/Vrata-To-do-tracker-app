import React, { useMemo } from 'react';
import { CheckCircle2, Circle, Flame, Zap, Timer, ListTodo, GraduationCap } from 'lucide-react';
import { Task, ExamEvent, FocusSession, TaskFrequency } from '../types';
import { XPState } from '../utils/stats';

interface TodayDashboardProps {
  tasks: Task[];
  examEvents: ExamEvent[];
  focusSessions: FocusSession[];
  streak: number;
  xp: XPState;
  onToggle: (id: string) => void;
}

const todayStr = () => new Date().toISOString().split('T')[0];

export const TodayDashboard: React.FC<TodayDashboardProps> = ({ tasks, examEvents, focusSessions, streak, xp, onToggle }) => {
  const today = todayStr();

  // Today = incomplete daily tasks + anything scheduled for today.
  const todaysTasks = useMemo(() =>
    tasks.filter(t => !t.completed && (t.frequency === TaskFrequency.DAILY || t.scheduledDate === today)),
  [tasks, today]);

  const focusToday = useMemo(() =>
    focusSessions.filter(s => (s.date || '').split('T')[0] === today).reduce((sum, s) => sum + s.minutes, 0),
  [focusSessions, today]);

  const nextExam = useMemo(() => {
    const upcoming = examEvents
      .map(e => ({ ...e, days: Math.round((new Date(`${e.date}T00:00:00`).getTime() - new Date(today + 'T00:00:00').getTime()) / 86_400_000) }))
      .filter(e => e.days >= 0)
      .sort((a, b) => a.days - b.days);
    return upcoming[0] || null;
  }, [examEvents, today]);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  })();

  const stat = (icon: React.ReactNode, value: React.ReactNode, label: string) => (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 text-zinc-500 mb-2">{icon}<span className="text-[10px] uppercase tracking-widest">{label}</span></div>
      <div className="text-2xl font-light text-white">{value}</div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <p className="text-zinc-500">{greeting}. Here's your day.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stat(<Flame size={14} className={streak > 0 ? 'text-orange-400' : ''} />, `${streak}`, 'Day streak')}
        {stat(<Zap size={14} />, `Lv ${xp.level}`, `${xp.xp} XP`)}
        {stat(<Timer size={14} />, `${focusToday}m`, 'Focus today')}
        {stat(<ListTodo size={14} />, `${todaysTasks.length}`, 'To do today')}
      </div>

      {nextExam && (
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
          <GraduationCap size={22} className="text-white" />
          <div>
            <div className="text-2xl font-light text-white">
              {nextExam.days === 0 ? 'Today' : `${nextExam.days} day${nextExam.days === 1 ? '' : 's'}`}
              <span className="text-sm text-zinc-500 ml-2">until {nextExam.title}</span>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-textMuted uppercase tracking-widest mb-4">Today's Tasks</h3>
        {todaysTasks.length === 0 ? (
          <div className="text-center py-16 text-zinc-700 font-light border border-dashed border-border rounded-lg">
            Nothing due today. Enjoy the calm — or get ahead.
          </div>
        ) : (
          <div className="space-y-2">
            {todaysTasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-surface border border-transparent hover:border-border rounded-lg transition-colors">
                <button onClick={() => onToggle(t.id)} className="text-zinc-400 hover:text-white">
                  {t.completed ? <CheckCircle2 size={20} className="text-zinc-500" /> : <Circle size={20} />}
                </button>
                <span className="text-sm text-zinc-200">{t.title}</span>
                <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold bg-zinc-900 px-1.5 py-0.5 rounded ml-auto">{t.frequency}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
