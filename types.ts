
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

// ---- Voice assistant ----

export type VoiceIntentType =
  | 'ADD_TASK'
  | 'COMPLETE_TASK'
  | 'DELETE_TASK'
  | 'QUERY_SCHEDULE'
  | 'QUERY_TASKS'
  | 'UNKNOWN';

// Structured result of parsing a spoken command with Gemini.
export interface VoiceCommandResult {
  intent: VoiceIntentType;
  title?: string;
  frequency?: TaskFrequency;
  details?: string;
  date?: string; // YYYY-MM-DD, when the user specified one
  reply: string; // short spoken confirmation / answer
}

// Optional extra fields TaskInput can pass through onAdd (e.g. a YouTube link).
export interface TaskExtras {
  youtubeUrl?: string;
}
