import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { User } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Task, TaskFrequency, ExamEvent, FocusSession, Priority } from '../types';
import { db, isFirebaseConfigured } from '../services/firebase';

const TASKS_KEY = 'vrata_tasks';
const EXAMS_KEY = 'vrata_exam_events';
const FOCUS_KEY = 'vrata_focus_sessions';

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
}

const load = <T,>(key: string): T[] => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
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
 * Owns tasks + exam events + focus sessions: localStorage persistence, the
 * recurring-task reset, all CRUD, and — when a Firebase user is signed in —
 * real-time cross-device sync via a single Firestore document `users/{uid}`.
 * Signed out (or Firebase unconfigured) it behaves like the localStorage-only app.
 */
export function useTasks(user?: User | null) {
  const configured = isFirebaseConfigured();
  const [tasks, setTasks] = useState<Task[]>(() => load<Task>(TASKS_KEY));
  const [examEvents, setExamEvents] = useState<ExamEvent[]>(() => load<ExamEvent>(EXAMS_KEY));
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => load<FocusSession>(FOCUS_KEY));
  const [syncing, setSyncing] = useState(false);

  const tasksRef = useRef(tasks); tasksRef.current = tasks;
  const examsRef = useRef(examEvents); examsRef.current = examEvents;
  const focusRef = useRef(focusSessions); focusRef.current = focusSessions;
  const lastSyncedRef = useRef<string>('');       // JSON we last wrote/received
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
        if (t.frequency === TaskFrequency.DAILY) {
          if (t.completed && completedDate && completedDate.toISOString().split('T')[0] !== todayStr) {
            changed = true; return { ...t, completed: false, completedAt: undefined };
          }
        } else if (t.frequency === TaskFrequency.WEEKLY) {
          if (t.completed && completedDate && completedDate < monday) {
            changed = true; return { ...t, completed: false, completedAt: undefined };
          }
        } else if (t.frequency === TaskFrequency.MONTHLY) {
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
      if (initializedUidRef.current !== user.uid) {
        // First snapshot for this user: merge whatever is local with the cloud
        // once, so signing in never loses local data.
        initializedUidRef.current = user.uid;
        const rTasks: Task[] = snap.exists() ? (snap.data().tasks || []) : [];
        const rExams: ExamEvent[] = snap.exists() ? (snap.data().examEvents || []) : [];
        const rFocus: FocusSession[] = snap.exists() ? (snap.data().focusSessions || []) : [];
        const mergedTasks = sortByCreated(unionById(rTasks, tasksRef.current));
        const mergedExams = unionById(rExams, examsRef.current);
        const mergedFocus = unionById(rFocus, focusRef.current);
        lastSyncedRef.current = JSON.stringify({ tasks: mergedTasks, examEvents: mergedExams, focusSessions: mergedFocus });
        setTasks(mergedTasks);
        setExamEvents(mergedExams);
        setFocusSessions(mergedFocus);
        setDoc(ref, { tasks: mergedTasks, examEvents: mergedExams, focusSessions: mergedFocus, updatedAt: Date.now() }, { merge: true })
          .catch(err => console.error('Sync seed failed:', err));
      } else {
        // Later updates: the cloud is the source of truth. Skip our own echoes.
        if (snap.metadata.hasPendingWrites) return;
        const remote = {
          tasks: (snap.data()?.tasks || []) as Task[],
          examEvents: (snap.data()?.examEvents || []) as ExamEvent[],
          focusSessions: (snap.data()?.focusSessions || []) as FocusSession[],
        };
        const payload = JSON.stringify(remote);
        if (payload === lastSyncedRef.current) return;
        lastSyncedRef.current = payload;
        setTasks(remote.tasks);
        setExamEvents(remote.examEvents);
        setFocusSessions(remote.focusSessions);
      }
      setSyncing(false);
    }, err => { console.error('Sync error:', err); setSyncing(false); });

    return () => unsub();
  }, [user, configured]);

  // Persist: always cache to localStorage; when signed in, debounce-write to the
  // cloud. Skips writes that merely echo a value we just synced (loop guard).
  useEffect(() => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    localStorage.setItem(EXAMS_KEY, JSON.stringify(examEvents));
    localStorage.setItem(FOCUS_KEY, JSON.stringify(focusSessions));

    if (!user || !configured || !db) return;
    if (initializedUidRef.current !== user.uid) return; // wait for initial merge

    const payload = JSON.stringify({ tasks, examEvents, focusSessions });
    if (payload === lastSyncedRef.current) return;
    lastSyncedRef.current = payload;

    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => {
      setDoc(doc(db!, 'users', user.uid), { tasks, examEvents, focusSessions, updatedAt: Date.now() }, { merge: true })
        .catch(err => console.error('Sync write failed:', err));
    }, 500);
  }, [tasks, examEvents, focusSessions, user, configured]);

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

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const pinExam = useCallback((title: string, date: string, color: string) => {
    setExamEvents(prev => [...prev.filter(e => e.date !== date), { id: uuidv4(), title, date, color }]);
  }, []);

  const addFocusSession = useCallback((minutes: number, taskId?: string, label?: string) => {
    setFocusSessions(prev => [
      { id: uuidv4(), date: new Date().toISOString(), minutes, taskId, label },
      ...prev,
    ]);
  }, []);

  return {
    tasks,
    examEvents,
    focusSessions,
    createTask,
    toggleTask,
    deleteTask,
    updateTask,
    pinExam,
    addFocusSession,
    syncing,
  };
}
