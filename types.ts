
export enum TaskFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  EXAM = 'EXAM',
  RUNNING = 'RUNNING',
  STUDY = 'STUDY'
}

export type RunType = 'TEMPO' | 'INTERVAL' | 'LONG' | 'EASY' | 'RECOVERY' | 'REST' | 'NONE';

export interface Task {
  id: string;
  title: string;
  details?: string;
  completed: boolean;
  frequency: TaskFrequency;
  createdAt: string; // ISO Date string
  completedAt?: string; // ISO Date string
  scheduledDate?: string; // ISO Date string (YYYY-MM-DD)
  runType?: RunType;
  googleEventId?: string; // Google Calendar event id, once synced
  youtubeUrl?: string; // Original YouTube link for STUDY tasks
  youtubeVideoId?: string; // Parsed YouTube video id for thumbnail/embed
}

export interface ExamEvent {
  id: string;
  title: string;
  date: string; // ISO Date string (YYYY-MM-DD)
  color: string; // Hex color code
  googleEventId?: string; // Google Calendar event id, once synced
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

// Optional extra fields TaskInput can pass through onAdd (e.g. a YouTube link).
export interface TaskExtras {
  youtubeUrl?: string;
}
