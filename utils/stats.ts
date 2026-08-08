// Derived gamification + heatmap stats. Everything here is computed from the
// tasks' completion history, so nothing new needs to be stored or synced.

import { Task } from '../types';

const dayKey = (d: Date): string => d.toISOString().split('T')[0];

// Set of YYYY-MM-DD strings on which at least one task was completed.
const completionDays = (tasks: Task[]): Set<string> => {
  const set = new Set<string>();
  tasks.forEach(t => { if (t.completed && t.completedAt) set.add(t.completedAt.split('T')[0]); });
  return set;
};

/**
 * Current daily streak: consecutive days (ending today, or yesterday if nothing
 * done yet today) with at least one completion.
 */
export const computeStreak = (tasks: Task[]): number => {
  const days = completionDays(tasks);
  if (days.size === 0) return 0;

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // Allow the streak to survive "today not done yet" by starting from yesterday.
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export interface XPState {
  xp: number;
  level: number;
  intoLevel: number;   // XP earned within the current level
  forNextLevel: number; // XP needed to fill the current level
}

// 10 XP per completed task; each level costs 100 XP.
export const computeXP = (tasks: Task[]): XPState => {
  const xp = tasks.filter(t => t.completed).length * 10;
  const forNextLevel = 100;
  const level = Math.floor(xp / forNextLevel) + 1;
  const intoLevel = xp % forNextLevel;
  return { xp, level, intoLevel, forNextLevel };
};

export interface Badge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}

export const earnedBadges = (tasks: Task[]): Badge[] => {
  const completed = tasks.filter(t => t.completed).length;
  const streak = computeStreak(tasks);
  const studied = tasks.filter(t => t.frequency === 'STUDY' && t.completed).length;
  const fitness = tasks.filter(t => t.frequency === 'FITNESS' && t.completed).length;

  const defs: [string, string, string, boolean][] = [
    ['first', 'First Step', 'Complete your first task', completed >= 1],
    ['ten', 'Getting Going', 'Complete 10 tasks', completed >= 10],
    ['century', 'Centurion', 'Complete 100 tasks', completed >= 100],
    ['week', 'On Fire', 'Reach a 7-day streak', streak >= 7],
    ['month', 'Unbreakable', 'Reach a 30-day streak', streak >= 30],
    ['scholar', 'Scholar', 'Complete 10 study sessions', studied >= 10],
    ['athlete', 'Athlete', 'Complete 10 fitness sessions', fitness >= 10],
  ];
  return defs.map(([id, label, description, earned]) => ({ id, label, description, earned }));
};

export interface HeatCell {
  date: string; // YYYY-MM-DD
  count: number;
}

// Completions per day for the last `days` days (oldest first).
export const heatmapData = (tasks: Task[], days = 371): HeatCell[] => {
  const counts = new Map<string, number>();
  tasks.forEach(t => {
    if (t.completed && t.completedAt) {
      const k = t.completedAt.split('T')[0];
      counts.set(k, (counts.get(k) || 0) + 1);
    }
  });
  const cells: HeatCell[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const k = dayKey(cursor);
    cells.push({ date: k, count: counts.get(k) || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
};
