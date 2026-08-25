import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { User } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Task, TaskFrequency, ExamEvent, FocusSession, Priority, Note, Goal, Settings, GateSubject, RepeatCadence } from '../types';
import { db, isFirebaseConfigured } from '../services/firebase';
import { DEFAULT_GATE_SUBJECTS } from '../utils/gate';
import { parseYouTubeId, parsePlaylistId } from '../utils/youtube';
import { fetchPlaylistVideos } from '../services/youtubePlaylist';

const TASKS_KEY = 'vrata_tasks';
const EXAMS_KEY = 'vrata_exam_events';
const FOCUS_KEY = 'vrata_focus_sessions';
const NOTES_KEY = 'vrata_notes';
const GOALS_KEY = 'vrata_goals';
const SETTINGS_KEY = 'vrata_settings';
const GATE_KEY = 'vrata_gate';

export interface NewTaskInput {
  title: string;
  frequency: TaskFrequency;
  details?: string;
  scheduledDate?: string;
  runType?: Task['runType'];
  youtubeUrl?: string;
  youtubeVideoId?: string;
  priority?: Priority;
  tags?: string[];
  remindAt?: string;
  repeat?: RepeatCadence;
}

const loadList = <T,>(key: string): T[] => {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : []; } catch { return []; }
};
const loadObj = <T,>(key: string, fallback: T): T => {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
};

// Merge two id-keyed lists (remote wins on conflict).
const unionById = <T extends { id: string }>(remote: T[], local: T[]): T[] => {
  const map = new Map<string, T>();
  local.forEach(i => map.set(i.id, i));
  remote.forEach(i => map.set(i.id, i));
  return Array.from(map.values());
};

const sortByCreated = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

/**
 * Owns all synced data — tasks, exam events, focus sessions, notes, goals and
 * settings — with localStorage persistence, the recurring-task reset, CRUD, and
 * (when signed in) real-time cross-device sync via one Firestore doc `users/{uid}`.
 */
export function useTasks(user?: User | null) {
  const configured = isFirebaseConfigured();
  const [tasks, setTasks] = useState<Task[]>(() => loadList<Task>(TASKS_KEY));
  const [examEvents, setExamEvents] = useState<ExamEvent[]>(() => loadList<ExamEvent>(EXAMS_KEY));
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => loadList<FocusSession>(FOCUS_KEY));
  const [notes, setNotes] = useState<Note[]>(() => loadList<Note>(NOTES_KEY));
  const [goals, setGoals] = useState<Goal[]>(() => loadList<Goal>(GOALS_KEY));
  const [settings, setSettings] = useState<Settings>(() => loadObj<Settings>(SETTINGS_KEY, {}));
  const [gate, setGate] = useState<GateSubject[]>(() => {
    const saved = loadList<GateSubject>(GATE_KEY);
    return saved.length ? saved : DEFAULT_GATE_SUBJECTS();
  });
  const [syncing, setSyncing] = useState(false);

  const tasksRef = useRef(tasks); tasksRef.current = tasks;
  const examsRef = useRef(examEvents); examsRef.current = examEvents;
  const focusRef = useRef(focusSessions); focusRef.current = focusSessions;
  const notesRef = useRef(notes); notesRef.current = notes;
  const goalsRef = useRef(goals); goalsRef.current = goals;
  const settingsRef = useRef(settings); settingsRef.current = settings;
  const gateRef = useRef(gate); gateRef.current = gate;
  const lastSyncedRef = useRef<string>('');
  const initializedUidRef = useRef<string | null>(null);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset recurring tasks whose period rolled over; drop stale fitness tasks.
  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monday = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    setTasks(prev => {
      let changed = false;
      const updated = prev.map(t => {
        const completedDate = t.completedAt ? new Date(t.completedAt) : null;
        // Effective cadence: an explicit per-task repeat, else the frequency tab
        // (Daily/Weekly/Monthly) as before.
        const cadence: RepeatCadence =
          t.repeat && t.repeat !== 'NONE' ? t.repeat
          : t.frequency === TaskFrequency.DAILY ? 'DAILY'
          : t.frequency === TaskFrequency.WEEKLY ? 'WEEKLY'
          : t.frequency === TaskFrequency.MONTHLY ? 'MONTHLY'
          : 'NONE';

        if (cadence === 'DAILY') {
          if (t.completed && completedDate && completedDate.toISOString().split('T')[0] !== todayStr) {
            changed = true; return { ...t, completed: false, completedAt: undefined };
          }
        } else if (cadence === 'WEEKLY') {
          if (t.completed && completedDate && completedDate < monday) {
            changed = true; return { ...t, completed: false, completedAt: undefined };
          }
        } else if (cadence === 'MONTHLY') {
          if (t.completed && completedDate && completedDate.getMonth() !== now.getMonth()) {
            changed = true; return { ...t, completed: false, completedAt: undefined };
          }
        }
        return t;
      }).filter(t => {
        if (t.frequency === TaskFrequency.FITNESS) {
          const createdDate = new Date(t.createdAt);
          const twoWeeksAgo = new Date(monday);
          twoWeeksAgo.setDate(monday.getDate() - 7);
          if (createdDate < twoWeeksAgo) { changed = true; return false; }
        }
        return true;
      });
      return changed ? updated : prev;
    });
  }, []);

  // Subscribe to the user's cloud document for real-time cross-device updates.
  useEffect(() => {
    if (!user || !configured || !db) { initializedUidRef.current = null; return; }
    const ref = doc(db, 'users', user.uid);
    setSyncing(true);
    const unsub = onSnapshot(ref, snap => {
      const data: any = snap.exists() ? snap.data() : {};
      if (initializedUidRef.current !== user.uid) {
        // First snapshot for this user: merge local with cloud once (no data loss).
        initializedUidRef.current = user.uid;
        const mTasks = sortByCreated(unionById(data.tasks || [], tasksRef.current));
        const mExams = unionById(data.examEvents || [], examsRef.current);
        const mFocus = unionById(data.focusSessions || [], focusRef.current);
        const mNotes = unionById(data.notes || [], notesRef.current);
        const mGoals = unionById(data.goals || [], goalsRef.current);
        const mSettings = { ...settingsRef.current, ...(data.settings || {}) };
        const mGate = unionById(data.gate || [], gateRef.current);
        lastSyncedRef.current = JSON.stringify({ tasks: mTasks, examEvents: mExams, focusSessions: mFocus, notes: mNotes, goals: mGoals, settings: mSettings, gate: mGate });
        setTasks(mTasks); setExamEvents(mExams); setFocusSessions(mFocus); setNotes(mNotes); setGoals(mGoals); setSettings(mSettings); setGate(mGate);
        setDoc(ref, { tasks: mTasks, examEvents: mExams, focusSessions: mFocus, notes: mNotes, goals: mGoals, settings: mSettings, gate: mGate, updatedAt: Date.now() }, { merge: true })
          .catch(err => console.error('Sync seed failed:', err));
      } else {
        if (snap.metadata.hasPendingWrites) return;
        const remote = {
          tasks: (data.tasks || []) as Task[],
          examEvents: (data.examEvents || []) as ExamEvent[],
          focusSessions: (data.focusSessions || []) as FocusSession[],
          notes: (data.notes || []) as Note[],
          goals: (data.goals || []) as Goal[],
          settings: (data.settings || {}) as Settings,
          gate: (data.gate && data.gate.length ? data.gate : gateRef.current) as GateSubject[],
        };
        const payload = JSON.stringify(remote);
        if (payload === lastSyncedRef.current) return;
        lastSyncedRef.current = payload;
        setTasks(remote.tasks); setExamEvents(remote.examEvents); setFocusSessions(remote.focusSessions);
        setNotes(remote.notes); setGoals(remote.goals); setSettings(remote.settings); setGate(remote.gate);
      }
      setSyncing(false);
    }, err => { console.error('Sync error:', err); setSyncing(false); });

    return () => unsub();
  }, [user, configured]);

  // Persist: always cache to localStorage; when signed in, debounce-write to cloud.
  useEffect(() => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    localStorage.setItem(EXAMS_KEY, JSON.stringify(examEvents));
    localStorage.setItem(FOCUS_KEY, JSON.stringify(focusSessions));
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    localStorage.setItem(GATE_KEY, JSON.stringify(gate));

    if (!user || !configured || !db) return;
    if (initializedUidRef.current !== user.uid) return;

    const payload = JSON.stringify({ tasks, examEvents, focusSessions, notes, goals, settings, gate });
    if (payload === lastSyncedRef.current) return;
    lastSyncedRef.current = payload;

    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => {
      setDoc(doc(db!, 'users', user.uid), { tasks, examEvents, focusSessions, notes, goals, settings, gate, updatedAt: Date.now() }, { merge: true })
        .catch(err => console.error('Sync write failed:', err));
    }, 500);
  }, [tasks, examEvents, focusSessions, notes, goals, settings, gate, user, configured]);

  const createTask = useCallback((input: NewTaskInput): Task => {
    const newTask: Task = {
      id: uuidv4(),
      title: input.title,
      details: input.details,
      completed: false,
      frequency: input.frequency,
      createdAt: new Date().toISOString(),
      scheduledDate: input.scheduledDate,
      runType: input.runType,
      youtubeUrl: input.youtubeUrl,
      youtubeVideoId: input.youtubeVideoId,
      priority: input.priority,
      tags: input.tags && input.tags.length ? input.tags : undefined,
      remindAt: input.remindAt,
      repeat: input.repeat && input.repeat !== 'NONE' ? input.repeat : undefined,
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t =>
      t.id === id
        ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined }
        : t
    ));
  }, []);

  const deleteTask = useCallback((id: string) => setTasks(prev => prev.filter(t => t.id !== id)), []);
  const updateTask = useCallback((id: string, patch: Partial<Task>) =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t))), []);

  const pinExam = useCallback((title: string, date: string, color: string) => {
    setExamEvents(prev => [...prev.filter(e => e.date !== date), { id: uuidv4(), title, date, color }]);
  }, []);

  const addFocusSession = useCallback((minutes: number, taskId?: string, label?: string) => {
    setFocusSessions(prev => [{ id: uuidv4(), date: new Date().toISOString(), minutes, taskId, label }, ...prev]);
  }, []);

  // Notes
  const addNote = useCallback((): Note => {
    const note: Note = { id: uuidv4(), title: '', content: '', updatedAt: new Date().toISOString() };
    setNotes(prev => [note, ...prev]);
    return note;
  }, []);
  const updateNote = useCallback((id: string, patch: Partial<Note>) =>
    setNotes(prev => prev.map(n => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n))), []);
  const deleteNote = useCallback((id: string) => setNotes(prev => prev.filter(n => n.id !== id)), []);

  // Goals
  const addGoal = useCallback((title: string, description?: string, targetDate?: string): Goal => {
    const goal: Goal = { id: uuidv4(), title, description, targetDate, milestones: [], createdAt: new Date().toISOString() };
    setGoals(prev => [goal, ...prev]);
    return goal;
  }, []);
  const updateGoal = useCallback((id: string, patch: Partial<Goal>) =>
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, ...patch } : g))), []);
  const deleteGoal = useCallback((id: string) => setGoals(prev => prev.filter(g => g.id !== id)), []);

  const updateSettings = useCallback((patch: Partial<Settings>) =>
    setSettings(prev => ({ ...prev, ...patch })), []);

  // GATE prep
  const addGateVideo = useCallback((subjectId: string, url: string, title?: string) => {
    const videoId = parseYouTubeId(url);
    if (!videoId) return false;
    setGate(prev => prev.map(s => s.id === subjectId
      ? { ...s, videos: [...s.videos, { id: uuidv4(), title: title?.trim() || 'Video', url: url.trim(), videoId, done: false }] }
      : s));
    return true;
  }, []);
  // Import a whole YouTube playlist into a subject (dedupe by videoId).
  const addGatePlaylist = useCallback(async (subjectId: string, url: string): Promise<{ added: number }> => {
    const pid = parsePlaylistId(url);
    if (!pid) throw new Error('That is not a playlist link.');
    const vids = await fetchPlaylistVideos(pid);
    const subj = gateRef.current.find(s => s.id === subjectId);
    const existing = new Set((subj?.videos || []).map(v => v.videoId));
    const toAdd = vids.filter(v => !existing.has(v.videoId));
    if (toAdd.length) {
      setGate(prev => prev.map(s => s.id === subjectId
        ? { ...s, videos: [...s.videos, ...toAdd.map(v => ({ id: uuidv4(), title: v.title, url: `https://www.youtube.com/watch?v=${v.videoId}`, videoId: v.videoId, done: false }))] }
        : s));
    }
    return { added: toAdd.length };
  }, []);
  const toggleGateVideo = useCallback((subjectId: string, videoId: string) => {
    setGate(prev => prev.map(s => s.id === subjectId
      ? { ...s, videos: s.videos.map(v => v.id === videoId ? { ...v, done: !v.done } : v) }
      : s));
  }, []);
  const deleteGateVideo = useCallback((subjectId: string, videoId: string) => {
    setGate(prev => prev.map(s => s.id === subjectId
      ? { ...s, videos: s.videos.filter(v => v.id !== videoId) }
      : s));
  }, []);
  const setGateTests = useCallback((subjectId: string, patch: { testsDone?: number; testsTarget?: number }) => {
    setGate(prev => prev.map(s => s.id === subjectId
      ? {
          ...s,
          testsDone: Math.max(0, patch.testsDone ?? s.testsDone),
          testsTarget: Math.max(1, patch.testsTarget ?? s.testsTarget),
        }
      : s));
  }, []);

  // Reset helpers (all sync via the persist effect when signed in).
  const resetStreak = useCallback(() => {
    setTasks(prev => prev.map(t => ({ ...t, completed: false, completedAt: undefined })));
    setFocusSessions([]);
    try { localStorage.removeItem('vrata_notified_reminders'); } catch { /* ignore */ }
  }, []);
  const resetTasks = useCallback(() => setTasks([]), []);
  const resetAll = useCallback(() => {
    setTasks([]); setExamEvents([]); setFocusSessions([]); setNotes([]); setGoals([]);
    try { localStorage.removeItem('vrata_notified_reminders'); } catch { /* ignore */ }
  }, []);

  return {
    tasks, examEvents, focusSessions, notes, goals, settings, gate,
    createTask, toggleTask, deleteTask, updateTask, pinExam, addFocusSession,
    addNote, updateNote, deleteNote,
    addGoal, updateGoal, deleteGoal,
    updateSettings,
    addGateVideo, addGatePlaylist, toggleGateVideo, deleteGateVideo, setGateTests,
    resetStreak, resetTasks, resetAll,
    syncing,
  };
}
