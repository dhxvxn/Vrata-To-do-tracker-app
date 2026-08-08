import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskFrequency } from '../types';

const STORAGE_KEY = 'vrata_tasks';

// Fields callers provide when creating a task. id / createdAt / completed are
// filled in here so every code path (form, voice, calendar) builds tasks the
// same way.
export interface NewTaskInput {
  title: string;
  frequency: TaskFrequency;
  details?: string;
  scheduledDate?: string;
  runType?: Task['runType'];
  youtubeUrl?: string;
  youtubeVideoId?: string;
}

// Loose, case-insensitive match so a spoken title ("revise calculus") can find
// the stored task even if it isn't word-for-word identical.
const findByTitle = (tasks: Task[], title: string): Task | undefined => {
  const needle = title.trim().toLowerCase();
  if (!needle) return undefined;
  return (
    tasks.find(t => t.title.toLowerCase() === needle) ||
    tasks.find(t => t.title.toLowerCase().includes(needle)) ||
    tasks.find(t => needle.includes(t.title.toLowerCase()))
  );
};

/**
 * Owns the task list: localStorage persistence, the recurring-task reset that
 * runs once on mount, and all CRUD. Kept as a hook so voice / calendar handlers
 * share one source of truth with the UI instead of re-implementing it.
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Persist on every change.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Periodic refresh: reset recurring tasks whose period rolled over, and drop
  // running tasks older than the previous week. Runs once per mount.
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

  // Voice helpers: complete / delete by spoken title. Return the matched task
  // (or undefined) so the caller can craft an accurate spoken reply.
  const completeTaskByTitle = useCallback((title: string): Task | undefined => {
    let matched: Task | undefined;
    setTasks(prev => {
      matched = findByTitle(prev.filter(t => !t.completed), title) || findByTitle(prev, title);
      if (!matched) return prev;
      const id = matched.id;
      return prev.map(t => (t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t));
    });
    return matched;
  }, []);

  const deleteTaskByTitle = useCallback((title: string): Task | undefined => {
    let matched: Task | undefined;
    setTasks(prev => {
      matched = findByTitle(prev, title);
      if (!matched) return prev;
      const id = matched.id;
      return prev.filter(t => t.id !== id);
    });
    return matched;
  }, []);

  return {
    tasks,
    setTasks,
    createTask,
    toggleTask,
    deleteTask,
    updateTask,
    completeTaskByTitle,
    deleteTaskByTitle,
  };
}
