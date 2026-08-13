import { useEffect, useRef } from 'react';
import { Task } from '../types';
import { showNotification, isGranted } from '../services/notificationService';

const NOTIFIED_KEY = 'vrata_notified_reminders';

const loadNotified = (): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]')); } catch { return new Set(); }
};
const saveNotified = (s: Set<string>) => localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...s]));

/**
 * Client-side reminders: every ~30s, fire a notification for any task whose
 * `remindAt` has passed and hasn't been notified yet. Fires while the app is open
 * or a background tab; not guaranteed when the app is fully closed.
 */
export function useReminders(tasks: Task[]) {
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  useEffect(() => {
    const check = () => {
      if (!isGranted()) return;
      const now = Date.now();
      const notified = loadNotified();
      let changed = false;
      tasksRef.current.forEach(t => {
        if (t.completed || !t.remindAt) return;
        const key = `${t.id}:${t.remindAt}`; // re-arms if the time is changed
        const due = new Date(t.remindAt).getTime();
        // Fire if due within the last 6 hours (so a missed check still notifies).
        if (due <= now && now - due < 6 * 3600_000 && !notified.has(key)) {
          showNotification('Vrata reminder', t.title);
          notified.add(key);
          changed = true;
        }
      });
      if (changed) saveNotified(notified);
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);
}
