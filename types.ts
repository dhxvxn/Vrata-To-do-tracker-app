export enum TaskFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  frequency: TaskFrequency;
  createdAt: string; // ISO Date string
  completedAt?: string; // ISO Date string
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