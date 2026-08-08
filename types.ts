
export enum TaskFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  EXAM = 'EXAM',
  FITNESS = 'FITNESS'
}

export type FitnessType = 'TEMPO' | 'INTERVAL' | 'LONG' | 'EASY_RECOVERY' | 'UPPER_BODY' | 'LOWER_BODY' | 'CORE_ABS' | 'NONE';

export interface Task {
  id: string;
  title: string;
  details?: string;
  completed: boolean;
  frequency: TaskFrequency;
  createdAt: string; // ISO Date string
  completedAt?: string; // ISO Date string
  scheduledDate?: string; // ISO Date string (YYYY-MM-DD)
  runType?: FitnessType; // Renamed conceptually but kept key for compatibility
}

export interface ExamEvent {
  id: string;
  title: string;
  date: string; // ISO Date string (YYYY-MM-DD)
  color: string; // Hex color code
}

export interface ProgressData {
  date: string;
  completionRate: number; // 0-100
}

export interface InsightState {
  loading: boolean;
  content: string | null;
  error: string | null;
}

export interface Quote {
  text: string;
  author: string;
}
