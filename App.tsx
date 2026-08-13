
import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Trash2,
  BarChart3,
  Calendar,
  CalendarDays,
  CalendarRange,
  Flame,
  GraduationCap,
  Activity,
  History,
  Clock,
  Edit2,
  CalendarPlus,
  CalendarCheck,
  CalendarClock,
  BookOpen,
  Loader2,
  Box,
  Search,
  Sun,
  FileText,
  Target,
  Code2,
  Bell,
  PartyPopper
} from 'lucide-react';
import { Task, TaskFrequency, FitnessType, Quote, TaskExtras, Priority, SubTask, WorkoutSet } from './types';
import { TaskInput } from './components/TaskInput';
import { ProgressChart } from './components/ProgressChart';
import { CategoryBarChart, FocusChart } from './components/AnalyticsCharts';
import { ExamCalendar } from './components/ExamCalendar';
import { FitnessSelector } from './components/FitnessSelector';
import { StudyCard } from './components/StudyCard';
import { FestivalCalendar } from './components/FestivalCalendar';
import { AuthControl } from './components/AuthControl';
import { StreakBadge } from './components/StreakBadge';
import { Heatmap } from './components/Heatmap';
import { FocusTimer } from './components/FocusTimer';
import { ExamCountdown } from './components/ExamCountdown';
import { WorkoutLog } from './components/WorkoutLog';
import { SubtaskList } from './components/SubtaskList';
import { CodingTracker } from './components/CodingTracker';
import { NotesView } from './components/NotesView';
import { GoalsView } from './components/GoalsView';
import { TodayDashboard } from './components/TodayDashboard';
import { getDailyQuote, generateWrappedReport } from './services/geminiService';
import { useTasks } from './hooks/useTasks';
import { useAuth } from './hooks/useAuth';
import { useReminders } from './hooks/useReminders';
import { parseYouTubeId } from './utils/youtube';
import { isGoogleConfigured } from './services/googleAuthService';
import { createEventFromTask } from './services/calendarService';
import { computeStreak, computeXP, earnedBadges } from './utils/stats';

const PRIORITY_COLORS: Record<Priority, string> = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#3b82f6' };
const priorityRank = (p?: Priority) => (p === 'HIGH' ? 0 : p === 'MEDIUM' ? 1 : p === 'LOW' ? 2 : 3);

const FITNESS_COLORS: Record<FitnessType, string> = {
  TEMPO: '#ef4444',
  INTERVAL: '#a855f7',
  LONG: '#3b82f6',
  EASY_RECOVERY: '#22c55e',
  UPPER_BODY: '#06b6d4',
  LOWER_BODY: '#6366f1',
  CORE_ABS: '#f43f5e',
  NONE: '#71717a'
};

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function App() {
  const auth = useAuth();
  const {
    tasks,
    examEvents,
    focusSessions,
    notes,
    goals,
    settings,
    createTask,
    toggleTask,
    deleteTask,
    updateTask,
    pinExam,
    addFocusSession,
    addNote,
    updateNote,
    deleteNote,
    addGoal,
    updateGoal,
    deleteGoal,
    updateSettings,
    syncing,
  } = useTasks(auth.user);

  useReminders(tasks);

  const [query, setQuery] = useState('');
  const streak = useMemo(() => computeStreak(tasks), [tasks]);
  const xp = useMemo(() => computeXP(tasks), [tasks]);
  const badges = useMemo(() => earnedBadges(tasks), [tasks]);

  const [activeTab, setActiveTab] = useState<TaskFrequency>(TaskFrequency.DAILY);
  const [showToday, setShowToday] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const [fitnessEditorMode, setFitnessEditorMode] = useState<'NONE' | 'THIS_WEEK' | 'NEXT_WEEK'>('NONE');
  const [selectedExamDate, setSelectedExamDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });
  const [selectedFitnessDay, setSelectedFitnessDay] = useState<number>(new Date().getDay());
  const [selectedFitnessType, setSelectedFitnessType] = useState<FitnessType>('NONE');

  const [quote, setQuote] = useState<Quote | null>(null);
  const [wrappedReport, setWrappedReport] = useState<{ month: string | null }>({ month: null });

  const quoteCategory = useMemo<'GENERAL' | 'EXAM' | 'FITNESS'>(() => {
    if (activeTab === TaskFrequency.EXAM || activeTab === TaskFrequency.STUDY) return 'EXAM';
    if (activeTab === TaskFrequency.FITNESS) return 'FITNESS';
    return 'GENERAL';
  }, [activeTab]);

  useEffect(() => {
    let active = true;
    getDailyQuote(quoteCategory).then(q => { if (active) setQuote(q); });
    return () => { active = false; };
  }, [quoteCategory]);

  useEffect(() => {
    if (showWrapped && !wrappedReport.month) {
      generateWrappedReport(tasks, 'MONTH').then(m => setWrappedReport({ month: m }));
    }
  }, [showWrapped, tasks, wrappedReport.month]);

  const resetViews = (setter: () => void) => {
    setShowToday(false); setShowAnalytics(false); setShowHistory(false); setShowWrapped(false);
    setShowCalendar(false); setShowNotes(false); setShowGoals(false); setShowConnect(false);
    setter();
  };

  const handleAddTask = (title: string, frequency: TaskFrequency, details?: string, extras?: TaskExtras) => {
    const now = new Date();
    let scheduledDate: string | undefined;

    if (frequency === TaskFrequency.EXAM) {
      scheduledDate = selectedExamDate.toISOString().split('T')[0];
    } else if (frequency === TaskFrequency.FITNESS) {
      const isNextWeek = fitnessEditorMode === 'NEXT_WEEK';
      const thisMonday = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      thisMonday.setDate(diff);
      const targetBase = new Date(thisMonday);
      if (isNextWeek) targetBase.setDate(thisMonday.getDate() + 7);
      const offset = selectedFitnessDay === 0 ? 6 : selectedFitnessDay - 1;
      const finalDate = new Date(targetBase);
      finalDate.setDate(targetBase.getDate() + offset);
      scheduledDate = finalDate.toISOString().split('T')[0];
    }

    let youtubeUrl: string | undefined;
    let youtubeVideoId: string | undefined;
    if (frequency === TaskFrequency.STUDY && extras?.youtubeUrl) {
      youtubeUrl = extras.youtubeUrl;
      youtubeVideoId = parseYouTubeId(extras.youtubeUrl) || undefined;
    }

    createTask({
      title,
      frequency,
      details,
      scheduledDate,
      runType: frequency === TaskFrequency.FITNESS ? selectedFitnessType : undefined,
      youtubeUrl,
      youtubeVideoId,
      priority: extras?.priority,
      tags: extras?.tags,
    });
  };

  // Search filter (title + tags) and priority sort for task lists.
  const matchesQuery = (t: Task) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return t.title.toLowerCase().includes(q) || (t.tags || []).some(tag => tag.toLowerCase().includes(q));
  };
  const byPriority = (a: Task, b: Task) => priorityRank(a.priority) - priorityRank(b.priority);

  // Push a scheduled task to Google Calendar and remember the event id.
  const handleSyncTask = async (task: Task) => {
    try {
      setSyncingId(task.id);
      const eventId = await createEventFromTask(task);
      updateTask(task.id, { googleEventId: eventId });
    } catch (e) {
      console.error('Calendar sync failed:', e);
    } finally {
      setSyncingId(null);
    }
  };

  const fitnessTasksGrouped = useMemo(() => {
    const grouped: Record<number, Task[]> = {};
    for (let i = 0; i < 7; i++) grouped[i] = [];
    const now = new Date();
    const day = now.getDay();
    const thisMonday = new Date(now);
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    thisMonday.setDate(diff);
    thisMonday.setHours(0, 0, 0, 0);
    const nextMonday = new Date(thisMonday);
    nextMonday.setDate(thisMonday.getDate() + 7);

    tasks.filter(t => t.frequency === TaskFrequency.FITNESS).forEach(t => {
      if (t.scheduledDate) {
        const d = new Date(t.scheduledDate);
        if (d >= thisMonday && d < nextMonday) grouped[d.getDay()].push(t);
      }
    });
    return grouped;
  }, [tasks]);

  const allCompletedTasks = useMemo(() =>
    tasks.filter(t => t.completed).sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return dateB - dateA;
    }), [tasks]);

  const progressData = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    return dates.map(date => {
      const dayTasks = tasks.filter(t => t.createdAt.split('T')[0] <= date);
      const completedCount = dayTasks.filter(t => t.completed && t.completedAt && t.completedAt.split('T')[0] <= date).length;
      const rate = dayTasks.length > 0 ? Math.round((completedCount / dayTasks.length) * 100) : 0;
      const parts = date.split('-');
      return { date: `${parts[1]}/${parts[2]}`, completionRate: rate };
    });
  }, [tasks]);

  const renderTask = (task: Task) => (
    <div key={task.id} className={`group flex flex-col p-4 bg-surface border border-transparent rounded-lg transition-all duration-300 ${task.completed ? 'opacity-50 grayscale' : 'hover:border-border'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={() => toggleTask(task.id)} className="w-6 h-6 flex items-center justify-center">
            {task.completed ? <CheckCircle2 size={22} className="text-zinc-500" /> : <Circle size={22} className="text-zinc-400" />}
          </button>
          <div className="flex flex-col">
            <span className={`text-sm sm:text-base flex items-center gap-2 ${task.completed ? 'text-zinc-600 line-through' : 'text-zinc-200'}`}>
              {task.priority && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} title={`${task.priority} priority`} />}
              {task.title}
            </span>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold bg-zinc-900 px-1.5 py-0.5 rounded">
                {task.frequency}
              </span>
              {task.runType && task.runType !== 'NONE' && (
                <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: FITNESS_COLORS[task.runType] }}>
                  {task.runType.replace('_', ' ')}
                </span>
              )}
              {task.tags && task.tags.map(tag => (
                <span key={tag} className="text-[8px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded">#{tag}</span>
              ))}
              {task.remindAt && !task.completed && (
                <span className="text-[8px] text-amber-400/80 font-mono flex items-center gap-1">
                  <Bell size={8} /> {new Date(task.remindAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {task.completedAt && (
                <span className="text-[8px] text-zinc-700 font-mono flex items-center gap-1">
                  <Clock size={8} /> {new Date(task.completedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          {isGoogleConfigured() && task.scheduledDate && !task.completed && (
            task.googleEventId ? (
              <span className="text-emerald-500/70 p-2" title="On Google Calendar"><CalendarCheck size={16} /></span>
            ) : (
              <button
                onClick={() => handleSyncTask(task)}
                disabled={syncingId === task.id}
                className="text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 p-2 disabled:opacity-40"
                title="Add to Google Calendar"
              >
                {syncingId === task.id ? <Loader2 size={16} className="animate-spin" /> : <CalendarPlus size={16} />}
              </button>
            )
          )}
          <button onClick={() => deleteTask(task.id)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 p-2"><Trash2 size={16} /></button>
        </div>
      </div>
      {task.details && !task.completed && (
        <div className="ml-10 mt-2 space-y-1">
          {task.details.split('\n').map((line, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-zinc-500 font-light">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-zinc-800" />
              <span>{line}</span>
            </div>
          ))}
        </div>
      )}
      {!task.completed && <SubtaskList task={task} onUpdate={(subtasks: SubTask[]) => updateTask(task.id, { subtasks })} />}
      {task.frequency === TaskFrequency.FITNESS && !task.completed && (
        <WorkoutLog task={task} onUpdate={(sets: WorkoutSet[]) => updateTask(task.id, { sets })} />
      )}
    </div>
  );

  const sidebarTabs = [
    { id: TaskFrequency.DAILY, icon: Calendar, label: 'Daily' },
    { id: TaskFrequency.WEEKLY, icon: CalendarDays, label: 'Weekly' },
    { id: TaskFrequency.MONTHLY, icon: CalendarRange, label: 'Monthly' },
    { id: TaskFrequency.EXAM, icon: GraduationCap, label: 'Exam' },
    { id: TaskFrequency.FITNESS, icon: Activity, label: 'Fitness' },
    { id: TaskFrequency.STUDY, icon: BookOpen, label: 'Studies' }
  ];

  const inTaskView = !showToday && !showAnalytics && !showHistory && !showWrapped && !showCalendar && !showNotes && !showGoals && !showConnect;

  return (
    <div className="min-h-screen bg-black text-textMain flex flex-col md:flex-row">
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-black">
            <Flame size={20} fill="black" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">VRATA</h1>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks…"
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-textMuted"
          />
        </div>
        <nav className="flex flex-col gap-1">
          <button
            onClick={() => resetViews(() => setShowToday(true))}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${showToday ? 'bg-white text-black' : 'text-textMuted hover:text-white hover:bg-surfaceHighlight'}`}
          >
            <Sun size={18} /> Today
          </button>
          {sidebarTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => resetViews(() => setActiveTab(tab.id))}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id && inTaskView ? 'bg-white text-black' : 'text-textMuted hover:text-white hover:bg-surfaceHighlight'}`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-6 flex flex-col gap-1 border-t border-border">
          <button onClick={() => resetViews(() => setShowNotes(true))} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${showNotes ? 'bg-surfaceHighlight text-white' : 'text-textMuted hover:text-white'}`}><FileText size={18} /> Notes</button>
          <button onClick={() => resetViews(() => setShowGoals(true))} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${showGoals ? 'bg-surfaceHighlight text-white' : 'text-textMuted hover:text-white'}`}><Target size={18} /> Goals</button>
          <button onClick={() => resetViews(() => setShowConnect(true))} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${showConnect ? 'bg-surfaceHighlight text-white' : 'text-textMuted hover:text-white'}`}><Code2 size={18} /> Coding</button>
          <button onClick={() => resetViews(() => setShowCalendar(true))} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${showCalendar ? 'bg-surfaceHighlight text-white' : 'text-textMuted hover:text-white'}`}><PartyPopper size={18} /> Festivals</button>
          <button onClick={() => resetViews(() => setShowAnalytics(true))} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${showAnalytics ? 'bg-surfaceHighlight text-white' : 'text-textMuted hover:text-white'}`}><BarChart3 size={18} /> Analytics</button>
          <button onClick={() => resetViews(() => setShowHistory(true))} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${showHistory ? 'bg-surfaceHighlight text-white' : 'text-textMuted hover:text-white'}`}><History size={18} /> History</button>
          <button onClick={() => resetViews(() => setShowWrapped(true))} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${showWrapped ? 'bg-surfaceHighlight text-white' : 'text-textMuted hover:text-white'}`}><Box size={18} /> Wrapped</button>

          <div className="pt-2 mt-1 border-t border-border space-y-2">
            <StreakBadge streak={streak} xp={xp} />
            <AuthControl
              configured={auth.configured}
              user={auth.user}
              loading={auth.loading}
              syncing={syncing}
              error={auth.error}
              onSignIn={auth.signInWithGoogle}
              onSignOut={auth.signOut}
            />
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-w-5xl mx-auto w-full">
        {quote && inTaskView && (
          <div className="mb-12 animate-in fade-in duration-700">
            <p className="text-xl md:text-2xl font-light italic text-zinc-400 leading-relaxed">"{quote.text}"</p>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-600 mt-4">— {quote.author}</p>
          </div>
        )}

        <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-light text-white tracking-tight">
              {showToday ? 'Today'
                : showNotes ? 'Notes'
                : showGoals ? 'Goals'
                : showConnect ? 'Coding'
                : showCalendar ? 'Festivals'
                : showWrapped ? 'Vrata Wrapped'
                : showAnalytics ? 'Analytics'
                : showHistory ? 'Completed Log'
                : activeTab === TaskFrequency.STUDY ? 'Study Library'
                : `${activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} Focus`}
            </h2>
          </div>
          {activeTab === TaskFrequency.FITNESS && inTaskView && (
            <div className="flex gap-2">
              <button onClick={() => setFitnessEditorMode(fitnessEditorMode === 'THIS_WEEK' ? 'NONE' : 'THIS_WEEK')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${fitnessEditorMode === 'THIS_WEEK' ? 'bg-white text-black' : 'border-zinc-800 text-zinc-500'}`}><Edit2 size={12} className="inline mr-2" /> Edit This Week</button>
              <button onClick={() => setFitnessEditorMode(fitnessEditorMode === 'NEXT_WEEK' ? 'NONE' : 'NEXT_WEEK')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${fitnessEditorMode === 'NEXT_WEEK' ? 'bg-white text-black' : 'border-zinc-800 text-zinc-500'}`}><CalendarPlus size={12} className="inline mr-2" /> Plan Next Week</button>
            </div>
          )}
        </header>

        {showToday ? (
          <TodayDashboard tasks={tasks} examEvents={examEvents} focusSessions={focusSessions} streak={streak} xp={xp} onToggle={toggleTask} />
        ) : showConnect ? (
          <CodingTracker settings={settings} onUpdateSettings={updateSettings} />
        ) : showNotes ? (
          <NotesView notes={notes} onAdd={addNote} onUpdate={updateNote} onDelete={deleteNote} />
        ) : showGoals ? (
          <GoalsView goals={goals} onAdd={addGoal} onUpdate={updateGoal} onDelete={deleteGoal} />
        ) : showCalendar ? (
          <FestivalCalendar />
        ) : showWrapped ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="bg-gradient-to-br from-zinc-900 to-black p-8 rounded-2xl border border-zinc-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
              <h3 className="text-5xl font-bold tracking-tighter text-white mb-6">The Cycle Concludes.</h3>
              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-zinc-300 font-light leading-relaxed">{wrappedReport.month || "Gathering your discipline data..."}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-surface border border-border rounded-xl">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Month Efficiency</p>
                <p className="text-4xl font-light">{Math.round((tasks.filter(t => t.completed).length / (tasks.length || 1)) * 100)}%</p>
              </div>
              <div className="p-6 bg-surface border border-border rounded-xl">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Fitness Streak</p>
                <p className="text-4xl font-light">{tasks.filter(t => t.frequency === TaskFrequency.FITNESS && t.completed).length} Days</p>
              </div>
            </div>
          </div>
        ) : showAnalytics ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <Heatmap tasks={tasks} />
            <ProgressChart data={progressData} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <CategoryBarChart data={sidebarTabs.map(t => ({ name: t.label, total: tasks.filter(tk => tk.frequency === t.id).length, completed: tasks.filter(tk => tk.frequency === t.id && tk.completed).length }))} />
              <FocusChart sessions={focusSessions} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-textMuted uppercase tracking-widest mb-4">Badges</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {badges.map(b => (
                  <div key={b.id} className={`p-4 rounded-lg border text-center ${b.earned ? 'bg-surface border-border' : 'bg-transparent border-zinc-900 opacity-40'}`}>
                    <div className="text-2xl mb-1">{b.earned ? '🏅' : '🔒'}</div>
                    <div className="text-xs text-zinc-200 font-medium">{b.label}</div>
                    <div className="text-[10px] text-zinc-500 mt-1 leading-tight">{b.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : showHistory ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {allCompletedTasks.length === 0 ? (
              <div className="text-center py-20 text-zinc-700 font-light border border-dashed border-border rounded-lg">
                No completed tasks found. Evidence of discipline will appear here.
              </div>
            ) : (
              <div className="space-y-2">
                {allCompletedTasks.map(renderTask)}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === TaskFrequency.EXAM && <ExamCountdown examEvents={examEvents} />}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {(activeTab === TaskFrequency.EXAM || (activeTab === TaskFrequency.FITNESS && fitnessEditorMode !== 'NONE')) && (
                <div className="lg:col-span-2 space-y-4">
                  {activeTab === TaskFrequency.EXAM
                    ? <ExamCalendar selectedDate={selectedExamDate} onSelectDate={setSelectedExamDate} examEvents={examEvents} tasks={tasks} onPinExam={pinExam} />
                    : <FitnessSelector selectedDay={selectedFitnessDay} onSelectDay={setSelectedFitnessDay} selectedType={selectedFitnessType} onSelectType={setSelectedFitnessType} />}
                </div>
              )}
              <div className={`${(activeTab === TaskFrequency.EXAM || (activeTab === TaskFrequency.FITNESS && fitnessEditorMode !== 'NONE')) ? 'lg:col-span-3' : 'lg:col-span-5'} space-y-6`}>
                {(activeTab !== TaskFrequency.FITNESS || fitnessEditorMode !== 'NONE') && <TaskInput onAdd={handleAddTask} selectedFrequency={activeTab} />}
                <div className="space-y-8">
                  {activeTab === TaskFrequency.FITNESS ? (
                    [1, 2, 3, 4, 5, 6, 0].map(dayIdx => {
                      const dayTasks = fitnessTasksGrouped[dayIdx].filter(matchesQuery);
                      return (
                        <div key={dayIdx} className="space-y-2">
                          <div className="flex items-center gap-3"><span className={`text-[10px] uppercase font-bold tracking-[0.2em] ${new Date().getDay() === dayIdx ? 'text-white' : 'text-zinc-600'}`}>{DAYS_OF_WEEK[dayIdx]}</span><div className="flex-1 h-px bg-zinc-900" /></div>
                          {dayTasks.length === 0 ? <div className="p-3 text-[10px] text-zinc-800 italic border border-dashed border-zinc-900 rounded-lg">No session planned.</div> : dayTasks.map(renderTask)}
                        </div>
                      );
                    })
                  ) : activeTab === TaskFrequency.STUDY ? (
                    tasks.filter(t => t.frequency === TaskFrequency.STUDY && !t.completed && matchesQuery(t)).length === 0 ? (
                      <div className="text-center py-20 text-zinc-700 font-light border border-dashed border-border rounded-lg">
                        {query ? 'No study sessions match your search.' : 'No study sessions yet. Add a topic and paste a YouTube link to begin.'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tasks.filter(t => t.frequency === TaskFrequency.STUDY && !t.completed && matchesQuery(t)).sort(byPriority).map(task => (
                          <StudyCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                        ))}
                      </div>
                    )
                  ) : (
                    tasks.filter(t => t.frequency === activeTab && !t.completed && matchesQuery(t)).sort(byPriority).map(renderTask)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <FocusTimer
        studyTasks={tasks.filter(t => t.frequency === TaskFrequency.STUDY && !t.completed).map(t => ({ id: t.id, title: t.title }))}
        onLogSession={addFocusSession}
      />
    </div>
  );
}

export default App;
