
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
  List,
  Edit2,
  CalendarPlus,
  ArrowRight
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskFrequency, ProgressData, InsightState, ExamEvent, RunType } from './types';
import { TaskInput } from './components/TaskInput';
import { ProgressChart } from './components/ProgressChart';
import { CategoryBarChart } from './components/AnalyticsCharts';
import { ExamCalendar } from './components/ExamCalendar';
import { RunSelector } from './components/RunSelector';
import { getProductivityInsight } from './services/geminiService';

const RUN_TYPE_COLORS: Record<RunType, string> = {
  TEMPO: '#ef4444',
  INTERVAL: '#a855f7',
  LONG: '#3b82f6',
  EASY: '#22c55e',
  RECOVERY: '#f59e0b',
  REST: '#ec4899',
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
  
  // Running Editor States
  const [runningEditorMode, setRunningEditorMode] = useState<'NONE' | 'THIS_WEEK' | 'NEXT_WEEK'>('NONE');

  const [selectedExamDate, setSelectedExamDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  });
  const [selectedRunDay, setSelectedRunDay] = useState<number>(new Date().getDay());
  const [selectedRunType, setSelectedRunType] = useState<RunType>('NONE');
  
  const [insight, setInsight] = useState<InsightState>({
    loading: false, content: null, error: null,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // Periodic Refresh Logic
  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const monday = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setHours(0,0,0,0);

    setTasks(prev => {
      let changed = false;
      const updated = prev.map(t => {
        const completedDate = t.completedAt ? new Date(t.completedAt) : null;

        if (t.frequency === TaskFrequency.DAILY) {
          if (t.completed && completedDate && completedDate.toISOString().split('T')[0] !== todayStr) {
            changed = true;
            return { ...t, completed: false, completedAt: undefined };
          }
        } else if (t.frequency === TaskFrequency.WEEKLY) {
          if (t.completed && completedDate && completedDate < monday) {
            changed = true;
            return { ...t, completed: false, completedAt: undefined };
          }
        } else if (t.frequency === TaskFrequency.MONTHLY) {
          if (t.completed && completedDate && completedDate.getMonth() !== now.getMonth()) {
            changed = true;
            return { ...t, completed: false, completedAt: undefined };
          }
        }
        return t;
      }).filter(t => {
        if (t.frequency === TaskFrequency.RUNNING) {
          const createdDate = new Date(t.createdAt);
          // Only auto-clear runs if they are from PREVIOUS weeks
          const twoWeeksAgo = new Date(monday);
          twoWeeksAgo.setDate(monday.getDate() - 7);
          if (createdDate < twoWeeksAgo) {
            changed = true;
            return false;
          }
        }
        return true;
      });

      return changed ? updated : prev;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('vrata_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('vrata_exam_events', JSON.stringify(examEvents));
  }, [examEvents]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault(); setDeferredPrompt(e); setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (showAnalytics && !insight.content && !insight.loading) {
      const fetchInsight = async () => {
        setInsight(prev => ({ ...prev, loading: true }));
        try {
          const content = await getProductivityInsight(tasks);
          setInsight({ content, loading: false, error: null });
        } catch (err: any) {
          setInsight({ content: null, loading: false, error: err.message });
        }
      };
      fetchInsight();
    }
  }, [showAnalytics, tasks, insight.content, insight.loading]);

  const addTask = (title: string, frequency: TaskFrequency, details?: string) => {
    const now = new Date();
    let scheduledDate: string | undefined;

    if (frequency === TaskFrequency.EXAM) {
      scheduledDate = selectedExamDate.toISOString().split('T')[0];
    } else if (frequency === TaskFrequency.RUNNING) {
      const isNextWeek = runningEditorMode === 'NEXT_WEEK';
      const currentDay = now.getDay(); // 0 = Sun
      
      // Calculate start of THIS week (Monday)
      const thisMonday = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      thisMonday.setDate(diff);
      
      const targetBase = new Date(thisMonday);
      if (isNextWeek) {
        targetBase.setDate(thisMonday.getDate() + 7);
      }
      
      // Map selectedRunDay (0=Sun, 1=Mon...) to target week offset
      // 1=Mon...6=Sat, 0=Sun
      const offset = selectedRunDay === 0 ? 6 : selectedRunDay - 1;
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
      runType: frequency === TaskFrequency.RUNNING ? selectedRunType : undefined
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          completed: !t.completed, 
          completedAt: !t.completed ? new Date().toISOString() : undefined 
        };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handlePinExam = (title: string, date: string, color: string) => {
    const newEvent: ExamEvent = { id: uuidv4(), title, date, color };
    setExamEvents(prev => [...prev.filter(e => e.date !== date), newEvent]);
  };

  const filteredTasks = useMemo(() => {
    if (activeTab === TaskFrequency.EXAM) {
      const dStr = selectedExamDate.toISOString().split('T')[0];
      return tasks.filter(t => t.frequency === TaskFrequency.EXAM && t.scheduledDate === dStr);
    }
    if (activeTab === TaskFrequency.RUNNING) {
      return tasks.filter(t => t.frequency === TaskFrequency.RUNNING);
    }
    return tasks.filter(t => t.frequency === activeTab);
  }, [tasks, activeTab, selectedExamDate]);

  const runningTasksGrouped = useMemo(() => {
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

    filteredTasks.forEach(t => {
      if (t.scheduledDate) {
        const d = new Date(t.scheduledDate);
        // If we are looking at This Week vs Next Week logic
        // For simplicity, let's group by day and filter based on the target week
        const isNextWeek = d >= nextMonday;
        const isThisWeek = d >= thisMonday && d < nextMonday;
        
        // Only show relevant runs depending on mode, or just show all for the current view
        // The prompt says "display the weeks run schedule", usually implying CURRENT.
        if (isThisWeek) {
          grouped[d.getDay()].push(t);
        }
      }
    });
    return grouped;
  }, [filteredTasks]);

  const completionRate = useMemo(() => {
    const relevantTasks = filteredTasks;
    if (relevantTasks.length === 0) return 0;
    const completed = relevantTasks.filter(t => t.completed).length;
    return Math.round((completed / relevantTasks.length) * 100);
  }, [filteredTasks]);

  const progressData = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return dates.map(date => {
      const dayTasks = tasks.filter(t => t.createdAt.split('T')[0] <= date);
      const completedCount = dayTasks.filter(t => 
        t.completed && t.completedAt && t.completedAt.split('T')[0] <= date
      ).length;
      const rate = dayTasks.length > 0 ? Math.round((completedCount / dayTasks.length) * 100) : 0;
      const dateParts = date.split('-');
      const formattedDate = dateParts.length >= 3 ? `${dateParts[1]}/${dateParts[2]}` : date;
      return { date: formattedDate, completionRate: rate };
    });
  }, [tasks]);

  const categoryChartData = useMemo(() => {
    const getStats = (freq: TaskFrequency) => {
      const list = tasks.filter(t => t.frequency === freq);
      return { total: list.length, completed: list.filter(t => t.completed).length };
    };
    return [
      { name: 'Daily', ...getStats(TaskFrequency.DAILY) },
      { name: 'Weekly', ...getStats(TaskFrequency.WEEKLY) },
      { name: 'Monthly', ...getStats(TaskFrequency.MONTHLY) },
      { name: 'Exam', ...getStats(TaskFrequency.EXAM) },
      { name: 'Running', ...getStats(TaskFrequency.RUNNING) },
    ];
  }, [tasks]);

  const completedTasksByFrequency = useMemo(() => {
    const completed = tasks.filter(t => t.completed);
    return {
      [TaskFrequency.DAILY]: completed.filter(t => t.frequency === TaskFrequency.DAILY),
      [TaskFrequency.WEEKLY]: completed.filter(t => t.frequency === TaskFrequency.WEEKLY),
      [TaskFrequency.MONTHLY]: completed.filter(t => t.frequency === TaskFrequency.MONTHLY),
      [TaskFrequency.EXAM]: completed.filter(t => t.frequency === TaskFrequency.EXAM),
      [TaskFrequency.RUNNING]: completed.filter(t => t.frequency === TaskFrequency.RUNNING),
    };
  }, [tasks]);

  const hasHistory = (Object.values(completedTasksByFrequency) as Task[][]).some(list => list.length > 0);

  const renderTask = (task: Task) => (
    <div key={task.id} className={`group flex flex-col p-4 bg-surface border border-transparent rounded-lg transition-all duration-300 ${task.completed ? 'opacity-50 grayscale' : 'hover:border-border'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={() => toggleTask(task.id)} className="relative flex items-center justify-center w-6 h-6 outline-none group/btn">
            {task.completed ? <CheckCircle2 size={22} className="text-zinc-500" /> : <Circle size={22} className="text-zinc-400 group-hover/btn:text-zinc-200" />}
          </button>
          <div className="flex items-center gap-3">
            {task.runType && task.runType !== 'NONE' && (
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RUN_TYPE_COLORS[task.runType] }} />
            )}
            <div className="flex flex-col">
              <span className={`text-sm sm:text-base transition-all ${task.completed ? 'text-zinc-600 line-through' : 'text-zinc-200'}`}>
                {task.title}
              </span>
              {task.runType && task.runType !== 'NONE' && (
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-60" style={{ color: RUN_TYPE_COLORS[task.runType] }}>
                  {task.runType}
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
            <div key={idx} className="flex items-start gap-2 text-xs text-zinc-500 font-light leading-relaxed">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-zinc-800 flex-shrink-0" />
              <span>{line}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-textMain flex flex-col md:flex-row selection:bg-zinc-800">
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-black">
            <Flame size={20} fill="black" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">VRATA</h1>
        </div>
        <nav className="flex flex-col gap-2">
          {[
            { id: TaskFrequency.DAILY, icon: Calendar, label: 'Daily' },
            { id: TaskFrequency.WEEKLY, icon: CalendarDays, label: 'Weekly' },
            { id: TaskFrequency.MONTHLY, icon: CalendarRange, label: 'Monthly' },
            { id: TaskFrequency.EXAM, icon: GraduationCap, label: 'Exam' },
            { id: TaskFrequency.RUNNING, icon: Activity, label: 'Running' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowAnalytics(false); setShowHistory(false); setRunningEditorMode('NONE'); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                !showAnalytics && !showHistory && activeTab === tab.id 
                  ? 'bg-white text-black' 
                  : 'text-textMuted hover:text-white hover:bg-surfaceHighlight'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-6 flex flex-col gap-2 border-t border-border">
          <button
            onClick={() => { setShowAnalytics(true); setShowHistory(false); setRunningEditorMode('NONE'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              showAnalytics ? 'bg-surfaceHighlight text-white border border-border' : 'text-textMuted hover:text-white'
            }`}
          >
            <BarChart3 size={18} />
            Analytics
          </button>
          <button
            onClick={() => { setShowHistory(true); setShowAnalytics(false); setRunningEditorMode('NONE'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              showHistory ? 'bg-surfaceHighlight text-white border border-border' : 'text-textMuted hover:text-white'
            }`}
          >
            <History size={18} />
            History
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-w-5xl mx-auto w-full">
        <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-light text-white tracking-tight">
              {showAnalytics ? 'Analytics' : showHistory ? 'Completed History' : `${activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} Focus`}
            </h2>
            <p className="text-textMuted mt-2 text-sm">
              {showAnalytics 
                ? 'Consistency is the discipline of greatness.' 
                : showHistory 
                  ? 'Evidence of your past discipline.'
                  : activeTab === TaskFrequency.RUNNING 
                    ? `Weekly running schedule. Focus on the miles.`
                    : `You have completed ${completionRate}% of your ${activeTab.toLowerCase()} targets.`}
            </p>
          </div>
          
          {activeTab === TaskFrequency.RUNNING && !showAnalytics && !showHistory && (
            <div className="flex items-center gap-2">
               <button 
                  onClick={() => setRunningEditorMode(runningEditorMode === 'THIS_WEEK' ? 'NONE' : 'THIS_WEEK')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                    runningEditorMode === 'THIS_WEEK' ? 'bg-white text-black border-white' : 'border-border text-zinc-400 hover:border-zinc-600'
                  }`}
               >
                 <Edit2 size={14} />
                 Edit This Week
               </button>
               <button 
                  onClick={() => setRunningEditorMode(runningEditorMode === 'NEXT_WEEK' ? 'NONE' : 'NEXT_WEEK')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                    runningEditorMode === 'NEXT_WEEK' ? 'bg-white text-black border-white' : 'border-border text-zinc-400 hover:border-zinc-600'
                  }`}
               >
                 <CalendarPlus size={14} />
                 Plan Next Week
               </button>
            </div>
          )}
        </header>

        {showAnalytics ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {insight.loading ? (
              <div className="bg-surface p-6 rounded-lg border border-border animate-pulse flex items-center gap-3">
                <Sparkles size={18} className="text-zinc-600" />
                <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
              </div>
            ) : insight.content ? (
              <div className="bg-surface p-6 rounded-lg border border-border flex items-start gap-4">
                <Sparkles size={18} className="text-white mt-1 flex-shrink-0" />
                <p className="text-zinc-300 italic font-light tracking-wide leading-relaxed">
                  "{insight.content}"
                </p>
              </div>
            ) : null}

            <ProgressChart data={progressData} />
            <CategoryBarChart data={categoryChartData} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Tasks', value: tasks.length },
                { label: 'Active Streak', value: '12 Days' },
                { label: 'Completion', value: `${tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%` }
              ].map(stat => (
                <div key={stat.label} className="bg-surface p-6 rounded-lg border border-border">
                  <div className="text-textMuted text-xs uppercase tracking-wider mb-2">{stat.label}</div>
                  <div className="text-3xl font-light text-white">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : showHistory ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!hasHistory ? (
              <div className="text-center py-20 text-zinc-700 font-light border border-dashed border-border rounded-lg">
                No history recorded yet. Complete some tasks to see them here.
              </div>
            ) : (
              (Object.entries(completedTasksByFrequency) as [TaskFrequency, Task[]][]).map(([freq, list]) => (
                list.length > 0 && (
                  <section key={freq} className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-zinc-900 pb-2">
                       <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">{freq} HISTORY</h3>
                       <div className="flex-1 h-px bg-zinc-900" />
                       <span className="text-[10px] font-mono text-zinc-600">{list.length} tasks</span>
                    </div>
                    <div className="space-y-2">
                      {list.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || '')).map((task) => (
                        <div key={task.id} className="group flex flex-col p-4 bg-surfaceHighlight/10 border border-zinc-900 rounded-lg hover:border-zinc-800 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <CheckCircle2 size={18} className="text-zinc-700" />
                              <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                  {task.runType && task.runType !== 'NONE' && (
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RUN_TYPE_COLORS[task.runType] }} />
                                  )}
                                  <span className="text-sm text-zinc-400 font-light">{task.title}</span>
                                </div>
                                {task.completedAt && (
                                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-600 font-mono">
                                    <Clock size={10} />
                                    <span>{new Date(task.completedAt).toLocaleDateString()} at {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <button onClick={() => deleteTask(task.id)} className="text-zinc-800 hover:text-red-900 transition-colors p-2">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          {task.details && (
                            <div className="ml-8 mt-2 space-y-1">
                              {task.details.split('\n').map((line, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-[10px] text-zinc-600 font-light">
                                  <span className="mt-1.5 w-0.5 h-0.5 rounded-full bg-zinc-800 flex-shrink-0" />
                                  <span>{line}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {(activeTab === TaskFrequency.EXAM || (activeTab === TaskFrequency.RUNNING && runningEditorMode !== 'NONE')) && (
                <div className="lg:col-span-2 space-y-4 animate-in slide-in-from-left-4 duration-300">
                  {activeTab === TaskFrequency.EXAM && (
                    <ExamCalendar selectedDate={selectedExamDate} onSelectDate={setSelectedExamDate} examEvents={examEvents} tasks={tasks} onPinExam={handlePinExam} />
                  )}
                  {activeTab === TaskFrequency.RUNNING && runningEditorMode !== 'NONE' && (
                    <>
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white flex items-center gap-2">
                          <Edit2 size={10} />
                          {runningEditorMode === 'THIS_WEEK' ? 'Editing This Week' : 'Planning Next Week'}
                        </h4>
                        <button onClick={() => setRunningEditorMode('NONE')} className="text-[10px] uppercase text-zinc-600 hover:text-white">Close</button>
                      </div>
                      <RunSelector selectedDay={selectedRunDay} onSelectDay={setSelectedRunDay} selectedRunType={selectedRunType} onSelectRunType={setSelectedRunType} />
                    </>
                  )}
                </div>
              )}

              <div className={`${(activeTab === TaskFrequency.EXAM || (activeTab === TaskFrequency.RUNNING && runningEditorMode !== 'NONE')) ? 'lg:col-span-3' : 'lg:col-span-5 max-w-3xl'} space-y-6`}>
                {/* Hide input if not in running edit mode */}
                {(activeTab !== TaskFrequency.RUNNING || runningEditorMode !== 'NONE') && (
                  <TaskInput onAdd={addTask} selectedFrequency={activeTab} />
                )}
                
                <div className="space-y-8">
                  {activeTab === TaskFrequency.RUNNING ? (
                    // Grouped Weekly View for Running
                    [1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
                      const dayTasks = runningTasksGrouped[dayIdx];
                      const isToday = new Date().getDay() === dayIdx;
                      
                      return (
                        <div key={dayIdx} className={`space-y-2 ${isToday ? 'relative' : ''}`}>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] uppercase font-bold tracking-[0.2em] ${isToday ? 'text-white' : 'text-zinc-600'}`}>
                              {DAYS_OF_WEEK[dayIdx]} {isToday && <span className="text-zinc-400 lowercase italic ml-1">(Today)</span>}
                            </span>
                            <div className="flex-1 h-px bg-zinc-900" />
                          </div>
                          
                          {dayTasks.length === 0 ? (
                            <div className="p-3 text-[10px] text-zinc-800 italic border border-dashed border-zinc-900 rounded-lg">
                              No runs scheduled.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {dayTasks.map(renderTask)}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    // Regular flat list for other frequencies
                    filteredTasks.length === 0 ? (
                      <div className="text-center py-20 text-zinc-700 font-light border border-dashed border-border rounded-lg">
                        No active tasks for this selection.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredTasks.map(renderTask)}
                      </div>
                    )
                  )}
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
