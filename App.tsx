
import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  BarChart3, 
  Sparkles,
  Calendar,
  CalendarDays,
  CalendarRange,
  Flame,
  Download,
  GraduationCap,
  Activity,
  History,
  Clock,
  Edit2,
  CalendarPlus,
  Box
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskFrequency, InsightState, ExamEvent, FitnessType, Quote } from './types';
import { TaskInput } from './components/TaskInput';
import { ProgressChart } from './components/ProgressChart';
import { CategoryBarChart } from './components/AnalyticsCharts';
import { ExamCalendar } from './components/ExamCalendar';
import { FitnessSelector } from './components/FitnessSelector';
import { getProductivityInsight, getDailyQuote, generateWrappedReport } from './services/geminiService';

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
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('vrata_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [examEvents, setExamEvents] = useState<ExamEvent[]>(() => {
    const saved = localStorage.getItem('vrata_exam_events');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeTab, setActiveTab] = useState<TaskFrequency>(TaskFrequency.DAILY);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  
  const [fitnessEditorMode, setFitnessEditorMode] = useState<'NONE' | 'THIS_WEEK' | 'NEXT_WEEK'>('NONE');
  const [selectedExamDate, setSelectedExamDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  });
  const [selectedFitnessDay, setSelectedFitnessDay] = useState<number>(new Date().getDay());
  const [selectedFitnessType, setSelectedFitnessType] = useState<FitnessType>('NONE');
  
  const [insight, setInsight] = useState<InsightState>({ loading: false, content: null, error: null });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [wrappedReport, setWrappedReport] = useState<{ month: string | null; year: string | null }>({ month: null, year: null });

  // Determine quote category based on current view
  const quoteCategory = useMemo(() => {
    if (activeTab === TaskFrequency.EXAM) return 'EXAM';
    if (activeTab === TaskFrequency.FITNESS) return 'FITNESS';
    return 'GENERAL';
  }, [activeTab]);

  useEffect(() => {
    const fetchDailyData = async () => {
      const q = await getDailyQuote(quoteCategory);
      setQuote(q);
    };
    fetchDailyData();
  }, [quoteCategory]);

  useEffect(() => {
    localStorage.setItem('vrata_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (showWrapped && !wrappedReport.month) {
      const generateReport = async () => {
        const m = await generateWrappedReport(tasks, 'MONTH');
        setWrappedReport(prev => ({ ...prev, month: m }));
      };
      generateReport();
    }
  }, [showWrapped, tasks]);

  const addTask = (title: string, frequency: TaskFrequency, details?: string) => {
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

    const newTask: Task = {
      id: uuidv4(),
      title,
      details,
      completed: false,
      frequency,
      createdAt: now.toISOString(),
      scheduledDate,
      runType: frequency === TaskFrequency.FITNESS ? selectedFitnessType : undefined
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t));
  };

  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const fitnessTasksGrouped = useMemo(() => {
    const grouped: Record<number, Task[]> = {};
    for (let i = 0; i < 7; i++) grouped[i] = [];
    const now = new Date();
    const day = now.getDay();
    const thisMonday = new Date(now);
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    thisMonday.setDate(diff);
    thisMonday.setHours(0,0,0,0);
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

  const allCompletedTasks = useMemo(() => {
    return tasks
      .filter(t => t.completed)
      .sort((a, b) => {
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [tasks]);

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
            <span className={`text-sm sm:text-base ${task.completed ? 'text-zinc-600 line-through' : 'text-zinc-200'}`}>{task.title}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold bg-zinc-900 px-1.5 py-0.5 rounded">
                {task.frequency}
              </span>
              {task.runType && task.runType !== 'NONE' && (
                <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: FITNESS_COLORS[task.runType] }}>
                  {task.runType.replace('_', ' ')}
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
        <button onClick={() => deleteTask(task.id)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 p-2"><Trash2 size={16} /></button>
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
    </div>
  );

  const sidebarTabs = [
    { id: TaskFrequency.DAILY, icon: Calendar, label: 'Daily' },
    { id: TaskFrequency.WEEKLY, icon: CalendarDays, label: 'Weekly' },
    { id: TaskFrequency.MONTHLY, icon: CalendarRange, label: 'Monthly' },
    { id: TaskFrequency.EXAM, icon: GraduationCap, label: 'Exam' },
    { id: TaskFrequency.FITNESS, icon: Activity, label: 'Fitness' }
  ];

  return (
    <div className="min-h-screen bg-black text-textMain flex flex-col md:flex-row">
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-black">
            <Flame size={20} fill="black" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">VRATA</h1>
        </div>
        <nav className="flex flex-col gap-1">
          {sidebarTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowAnalytics(false); setShowHistory(false); setShowWrapped(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id && !showAnalytics && !showHistory && !showWrapped ? 'bg-white text-black' : 'text-textMuted hover:text-white hover:bg-surfaceHighlight'}`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-6 flex flex-col gap-1 border-t border-border">
          <button onClick={() => { setShowAnalytics(true); setShowHistory(false); setShowWrapped(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${showAnalytics ? 'bg-surfaceHighlight text-white' : 'text-textMuted hover:text-white'}`}><BarChart3 size={18} /> Analytics</button>
          <button onClick={() => { setShowHistory(true); setShowAnalytics(false); setShowWrapped(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${showHistory ? 'bg-surfaceHighlight text-white' : 'text-textMuted hover:text-white'}`}><History size={18} /> History</button>
          <button onClick={() => { setShowWrapped(true); setShowAnalytics(false); setShowHistory(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${showWrapped ? 'bg-surfaceHighlight text-white' : 'text-textMuted hover:text-white'}`}><Box size={18} /> Wrapped</button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-w-5xl mx-auto w-full">
        {quote && !showWrapped && (
          <div className="mb-12 animate-in fade-in duration-700">
            <p className="text-xl md:text-2xl font-light italic text-zinc-400 leading-relaxed">"{quote.text}"</p>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-600 mt-4">— {quote.author}</p>
          </div>
        )}

        <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-light text-white tracking-tight">
              {showWrapped ? 'Vrata Wrapped' : showAnalytics ? 'Analytics' : showHistory ? 'Completed Log' : `${activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} Focus`}
            </h2>
          </div>
          {activeTab === TaskFrequency.FITNESS && !showAnalytics && !showHistory && !showWrapped && (
            <div className="flex gap-2">
              <button onClick={() => setFitnessEditorMode(fitnessEditorMode === 'THIS_WEEK' ? 'NONE' : 'THIS_WEEK')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${fitnessEditorMode === 'THIS_WEEK' ? 'bg-white text-black' : 'border-zinc-800 text-zinc-500'}`}><Edit2 size={12} className="inline mr-2" /> Edit This Week</button>
              <button onClick={() => setFitnessEditorMode(fitnessEditorMode === 'NEXT_WEEK' ? 'NONE' : 'NEXT_WEEK')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${fitnessEditorMode === 'NEXT_WEEK' ? 'bg-white text-black' : 'border-zinc-800 text-zinc-500'}`}><CalendarPlus size={12} className="inline mr-2" /> Plan Next Week</button>
            </div>
          )}
        </header>

        {showWrapped ? (
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
            <ProgressChart data={progressData} />
            <CategoryBarChart data={sidebarTabs.map(t => ({ name: t.label, total: tasks.filter(tk => tk.frequency === t.id).length, completed: tasks.filter(tk => tk.frequency === t.id && tk.completed).length }))} />
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
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {(activeTab === TaskFrequency.EXAM || (activeTab === TaskFrequency.FITNESS && fitnessEditorMode !== 'NONE')) && (
                <div className="lg:col-span-2 space-y-4">
                  {activeTab === TaskFrequency.EXAM ? <ExamCalendar selectedDate={selectedExamDate} onSelectDate={setSelectedExamDate} examEvents={examEvents} tasks={tasks} onPinExam={() => {}} /> : <FitnessSelector selectedDay={selectedFitnessDay} onSelectDay={setSelectedFitnessDay} selectedType={selectedFitnessType} onSelectType={setSelectedFitnessType} />}
                </div>
              )}
              <div className={`${(activeTab === TaskFrequency.EXAM || (activeTab === TaskFrequency.FITNESS && fitnessEditorMode !== 'NONE')) ? 'lg:col-span-3' : 'lg:col-span-5'} space-y-6`}>
                {(activeTab !== TaskFrequency.FITNESS || fitnessEditorMode !== 'NONE') && <TaskInput onAdd={addTask} selectedFrequency={activeTab} />}
                <div className="space-y-8">
                  {activeTab === TaskFrequency.FITNESS ? [1, 2, 3, 4, 5, 6, 0].map(dayIdx => (
                    <div key={dayIdx} className="space-y-2">
                      <div className="flex items-center gap-3"><span className={`text-[10px] uppercase font-bold tracking-[0.2em] ${new Date().getDay() === dayIdx ? 'text-white' : 'text-zinc-600'}`}>{DAYS_OF_WEEK[dayIdx]}</span><div className="flex-1 h-px bg-zinc-900" /></div>
                      {fitnessTasksGrouped[dayIdx].length === 0 ? <div className="p-3 text-[10px] text-zinc-800 italic border border-dashed border-zinc-900 rounded-lg">No session planned.</div> : fitnessTasksGrouped[dayIdx].map(renderTask)}
                    </div>
                  )) : tasks.filter(t => t.frequency === activeTab && !t.completed).map(renderTask)}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
