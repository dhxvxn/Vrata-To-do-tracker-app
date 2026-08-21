import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Flame, Zap, Timer, ListTodo, GraduationCap, Github, Code2 } from 'lucide-react';
import { Task, ExamEvent, FocusSession, TaskFrequency, GateSubject, Settings } from '../types';
import { XPState } from '../utils/stats';
import { Clock } from './Clock';
import { fetchGithubStats, fetchLeetcodeStats, GithubStats, LeetcodeStats } from '../services/codingService';

interface TodayDashboardProps {
  tasks: Task[];
  examEvents: ExamEvent[];
  focusSessions: FocusSession[];
  gate: GateSubject[];
  settings: Settings;
  streak: number;
  xp: XPState;
  onToggle: (id: string) => void;
}

const todayStr = () => new Date().toISOString().split('T')[0];

const Bar: React.FC<{ label: string; value: number; color: string; text: string }> = ({ label, value, color, text }) => (
  <div>
    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
      <span>{label}</span><span className="text-zinc-400">{text}</span>
    </div>
    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(Math.min(1, value) * 100)}%`, backgroundColor: color }} />
    </div>
  </div>
);

export const TodayDashboard: React.FC<TodayDashboardProps> = ({ tasks, examEvents, focusSessions, gate, settings, streak, xp, onToggle }) => {
  const today = todayStr();

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

  // GATE overall progress.
  const gateStats = useMemo(() => {
    const totalVideos = gate.reduce((n, s) => n + s.videos.length, 0);
    const watched = gate.reduce((n, s) => n + s.videos.filter(v => v.done).length, 0);
    const testsDone = gate.reduce((n, s) => n + s.testsDone, 0);
    const testsTarget = gate.reduce((n, s) => n + s.testsTarget, 0);
    return { totalVideos, watched, testsDone, testsTarget };
  }, [gate]);

  // Coding stats (fetched once when usernames are set).
  const [gh, setGh] = useState<GithubStats | null>(null);
  const [lc, setLc] = useState<LeetcodeStats | null>(null);
  useEffect(() => {
    if (settings.githubUser) fetchGithubStats(settings.githubUser).then(setGh).catch(() => setGh(null));
    if (settings.leetcodeUser) fetchLeetcodeStats(settings.leetcodeUser).then(setLc).catch(() => setLc(null));
  }, [settings.githubUser, settings.leetcodeUser]);

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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Clock />
      <div className="space-y-8">
        <p className="text-zinc-500">{greeting}. Here's your day.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stat(<Flame size={14} className={streak > 0 ? 'text-orange-400' : ''} />, `${streak}`, 'Day streak')}
          {stat(<Zap size={14} />, `Lv ${xp.level}`, `${xp.xp} XP`)}
          {stat(<Timer size={14} />, `${focusToday}m`, 'Focus today')}
          {stat(<ListTodo size={14} />, `${todaysTasks.length}`, 'To do today')}
        </div>

        {/* GATE progress (always visible) */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-white mb-4">
            <GraduationCap size={16} /><h3 className="text-sm font-bold uppercase tracking-widest">GATE CSE Progress</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Bar label="Syllabus coverage" value={gateStats.totalVideos ? gateStats.watched / gateStats.totalVideos : 0} color="#22c55e" text={`${gateStats.watched}/${gateStats.totalVideos}`} />
            <Bar label="Mock tests" value={gateStats.testsTarget ? gateStats.testsDone / gateStats.testsTarget : 0} color="#a855f7" text={`${gateStats.testsDone}/${gateStats.testsTarget}`} />
          </div>
        </div>

        {/* Coding progress (if usernames set) */}
        {(gh || lc) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gh && (
              <div className="bg-surface border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-300 mb-3"><Github size={15} /><span className="text-xs font-bold uppercase tracking-widest">GitHub</span></div>
                <div className="flex gap-6">
                  <div><div className="text-2xl font-light text-white">{gh.totalContributions}</div><div className="text-[10px] uppercase tracking-widest text-zinc-500">Contributions</div></div>
                  <div><div className="text-2xl font-light text-white flex items-center gap-1"><Flame size={15} className="text-orange-400" fill="#fb923c" />{gh.streak}</div><div className="text-[10px] uppercase tracking-widest text-zinc-500">Streak</div></div>
                </div>
              </div>
            )}
            {lc && (
              <div className="bg-surface border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-300 mb-3"><Code2 size={15} className="text-yellow-500" /><span className="text-xs font-bold uppercase tracking-widest">LeetCode · {lc.total}</span></div>
                <div className="space-y-1.5">
                  {([['Easy', lc.easy, '#22c55e'], ['Med', lc.medium, '#f59e0b'], ['Hard', lc.hard, '#ef4444']] as [string, number, string][]).map(([l, v, c]) => (
                    <Bar key={l} label={l} value={v / Math.max(lc.total, 1)} color={c} text={`${v}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {nextExam && (
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
            <GraduationCap size={22} className="text-white" />
            <div className="text-2xl font-light text-white">
              {nextExam.days === 0 ? 'Today' : `${nextExam.days} day${nextExam.days === 1 ? '' : 's'}`}
              <span className="text-sm text-zinc-500 ml-2">until {nextExam.title}</span>
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
    </div>
  );
};
