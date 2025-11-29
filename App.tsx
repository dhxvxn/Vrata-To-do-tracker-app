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
  Download
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskFrequency, ProgressData, InsightState } from './types';
import { TaskInput } from './components/TaskInput';
import { ProgressChart } from './components/ProgressChart';
import { getProductivityInsight } from './services/geminiService';

// Initial Mock Data
const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Deep Work Session (2h)', completed: false, frequency: TaskFrequency.DAILY, createdAt: new Date().toISOString() },
  { id: '2', title: 'Review Weekly Metrics', completed: true, frequency: TaskFrequency.WEEKLY, createdAt: new Date().toISOString() },
  { id: '3', title: 'Pay Server Bill', completed: false, frequency: TaskFrequency.MONTHLY, createdAt: new Date().toISOString() },
];

// Mock Progress Data for Chart
const MOCK_PROGRESS: ProgressData[] = [
  { date: 'Mon', completionRate: 45 },
  { date: 'Tue', completionRate: 70 },
  { date: 'Wed', completionRate: 30 },
  { date: 'Thu', completionRate: 85 },
  { date: 'Fri', completionRate: 60 },
  { date: 'Sat', completionRate: 90 },
  { date: 'Sun', completionRate: 50 },
];

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('vrata_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  
  const [activeTab, setActiveTab] = useState<TaskFrequency>(TaskFrequency.DAILY);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  const [insight, setInsight] = useState<InsightState>({
    loading: false,
    content: null,
    error: null,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    localStorage.setItem('vrata_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Handle PWA Install Prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    }
  };

  const addTask = (title: string, frequency: TaskFrequency) => {
    const newTask: Task = {
      id: uuidv4(),
      title,
      completed: false,
      frequency,
      createdAt: new Date().toISOString(),
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

  const handleGenerateInsight = async () => {
    setInsight({ loading: true, content: null, error: null });
    try {
      const result = await getProductivityInsight(tasks);
      setInsight({ loading: false, content: result, error: null });
    } catch (err) {
      setInsight({ loading: false, content: null, error: 'Failed to generate insight.' });
    }
  };

  const filteredTasks = useMemo(() => 
    tasks.filter(t => t.frequency === activeTab),
  [tasks, activeTab]);

  const completionRate = useMemo(() => {
    if (filteredTasks.length === 0) return 0;
    const completed = filteredTasks.filter(t => t.completed).length;
    return Math.round((completed / filteredTasks.length) * 100);
  }, [filteredTasks]);

  return (
    <div className="min-h-screen bg-black text-textMain flex flex-col md:flex-row selection:bg-zinc-800">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-black">
            <Flame size={20} fill="black" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">VRATA</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <button
            onClick={() => { setActiveTab(TaskFrequency.DAILY); setShowAnalytics(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              !showAnalytics && activeTab === TaskFrequency.DAILY 
                ? 'bg-white text-black' 
                : 'text-textMuted hover:text-white hover:bg-surfaceHighlight'
            }`}
          >
            <Calendar size={18} />
            Daily
          </button>
          <button
            onClick={() => { setActiveTab(TaskFrequency.WEEKLY); setShowAnalytics(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              !showAnalytics && activeTab === TaskFrequency.WEEKLY
                ? 'bg-white text-black' 
                : 'text-textMuted hover:text-white hover:bg-surfaceHighlight'
            }`}
          >
            <CalendarDays size={18} />
            Weekly
          </button>
          <button
            onClick={() => { setActiveTab(TaskFrequency.MONTHLY); setShowAnalytics(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              !showAnalytics && activeTab === TaskFrequency.MONTHLY
                ? 'bg-white text-black' 
                : 'text-textMuted hover:text-white hover:bg-surfaceHighlight'
            }`}
          >
            <CalendarRange size={18} />
            Monthly
          </button>
        </nav>

        <div className="mt-auto pt-6 flex flex-col gap-2 border-t border-border">
          {showInstallBtn && (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 transition-all border border-zinc-700"
            >
              <Download size={18} />
              Install App
            </button>
          )}

          <button
            onClick={() => setShowAnalytics(true)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              showAnalytics
                ? 'bg-surfaceHighlight text-white border border-border' 
                : 'text-textMuted hover:text-white'
            }`}
          >
            <BarChart3 size={18} />
            Analytics
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-w-5xl mx-auto w-full">
        
        {/* Header Section */}
        <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-light text-white tracking-tight">
              {showAnalytics ? 'Analytics & Insights' : `${activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} Focus`}
            </h2>
            <p className="text-textMuted mt-2 text-sm">
              {showAnalytics 
                ? 'Visualize your consistency and optimize your flow.' 
                : `You have completed ${completionRate}% of your ${activeTab.toLowerCase()} targets.`}
            </p>
          </div>
          
          {!showAnalytics && (
             <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
               <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
             </div>
          )}
        </header>

        {showAnalytics ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Graph Section */}
            <ProgressChart data={MOCK_PROGRESS} />

            {/* AI Insight Section */}
            <div className="bg-surfaceHighlight/20 border border-border rounded-lg p-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-white/10" />
               <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-2 text-white">
                   <Sparkles size={18} className={insight.loading ? "animate-pulse" : ""} />
                   <h3 className="font-medium text-sm uppercase tracking-wider">Vrata Intelligence</h3>
                 </div>
                 <button 
                  onClick={handleGenerateInsight}
                  disabled={insight.loading}
                  className="text-xs border border-border bg-black hover:bg-zinc-900 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                 >
                   {insight.loading ? 'Analyzing...' : 'Generate Insight'}
                 </button>
               </div>
               
               <div className="min-h-[60px] flex items-center">
                 {insight.content ? (
                   <p className="text-lg font-light leading-relaxed text-zinc-200">"{insight.content}"</p>
                 ) : (
                   <p className="text-sm text-zinc-600 italic">
                     Click generate to analyze your task completion patterns using Gemini AI.
                   </p>
                 )}
               </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface p-6 rounded-lg border border-border">
                <div className="text-textMuted text-xs uppercase tracking-wider mb-2">Total Tasks</div>
                <div className="text-3xl font-light text-white">{tasks.length}</div>
              </div>
              <div className="bg-surface p-6 rounded-lg border border-border">
                <div className="text-textMuted text-xs uppercase tracking-wider mb-2">Completed</div>
                <div className="text-3xl font-light text-white">{tasks.filter(t => t.completed).length}</div>
              </div>
              <div className="bg-surface p-6 rounded-lg border border-border">
                 <div className="text-textMuted text-xs uppercase tracking-wider mb-2">Efficiency</div>
                 <div className="text-3xl font-light text-white">
                   {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            <TaskInput onAdd={addTask} selectedFrequency={activeTab} />

            <div className="space-y-1">
              {filteredTasks.length === 0 ? (
                 <div className="text-center py-20 text-zinc-700 font-light">
                   No tasks set for this period.
                 </div>
              ) : (
                filteredTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`group flex items-center justify-between p-4 bg-surface border border-transparent rounded-lg transition-all duration-500 ease-out ${
                      task.completed 
                        ? 'opacity-50 bg-surfaceHighlight/20 scale-[0.99] grayscale' 
                        : 'opacity-100 hover:border-border scale-100'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className="relative flex items-center justify-center w-6 h-6 outline-none group/btn"
                      >
                         <div className={`absolute inset-0 transition-all duration-300 ease-out ${task.completed ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 -rotate-90'}`}>
                            <CheckCircle2 size={22} className="text-zinc-500" />
                         </div>
                         <div className={`absolute inset-0 transition-all duration-300 ease-out ${task.completed ? 'scale-50 opacity-0 rotate-90' : 'scale-100 opacity-100 rotate-0'}`}>
                            <Circle size={22} className="text-zinc-400 group-hover/btn:text-zinc-200 transition-colors" />
                         </div>
                      </button>
                      
                      <span 
                        className={`text-sm sm:text-base transition-all duration-500 ${
                          task.completed 
                            ? 'text-zinc-600 line-through decoration-zinc-800' 
                            : 'text-zinc-200'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;