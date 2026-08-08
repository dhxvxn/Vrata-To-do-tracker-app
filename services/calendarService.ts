// Thin fetch wrappers over the Google Calendar REST API, authenticated with the
// token from googleAuthService. Maps Vrata tasks/exams to all-day calendar
// events and back.

import { getToken } from './googleAuthService';
import { Task, ExamEvent } from '../types';

const API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  htmlLink?: string;
}

const authFetch = async (url: string, init: RequestInit = {}): Promise<Response> => {
  const token = await getToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Calendar API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res;
};

/** Upcoming events from now, ordered by start time. */
export const listUpcomingEvents = async (maxResults = 10): Promise<CalendarEvent[]> => {
  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(maxResults),
  });
  const res = await authFetch(`${API}?${params.toString()}`);
  const data = await res.json();
  return (data.items || []) as CalendarEvent[];
};

// The day AFTER a given YYYY-MM-DD, since Google all-day event `end.date` is
// exclusive.
const nextDay = (yyyyMmDd: string): string => {
  const d = new Date(`${yyyyMmDd}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

/** Create an all-day event for a task; returns the new event id. */
export const createEventFromTask = async (task: Task): Promise<string> => {
  const date = task.scheduledDate || new Date().toISOString().split('T')[0];
  const res = await authFetch(API, {
    method: 'POST',
    body: JSON.stringify({
      summary: task.title,
      description: [task.details, task.youtubeUrl].filter(Boolean).join('\n\n') || undefined,
      start: { date },
      end: { date: nextDay(date) },
    }),
  });
  const data = await res.json();
  return data.id as string;
};

/** Create an all-day event for a pinned exam; returns the new event id. */
export const createEventFromExam = async (exam: ExamEvent): Promise<string> => {
  const res = await authFetch(API, {
    method: 'POST',
    body: JSON.stringify({
      summary: `Exam: ${exam.title}`,
      start: { date: exam.date },
      end: { date: nextDay(exam.date) },
    }),
  });
  const data = await res.json();
  return data.id as string;
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  await authFetch(`${API}/${encodeURIComponent(eventId)}`, { method: 'DELETE' });
};

/** A short, speakable summary of the next few events (for the voice assistant). */
export const summarizeUpcoming = async (): Promise<string> => {
  const events = await listUpcomingEvents(5);
  if (events.length === 0) return 'Your calendar looks clear for now.';
  const parts = events.slice(0, 3).map(e => {
    const when = e.start?.dateTime
      ? new Date(e.start.dateTime).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
      : e.start?.date
        ? new Date(`${e.start.date}T00:00:00`).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
        : '';
    return `${e.summary}${when ? ` on ${when}` : ''}`;
  });
  return `Next up: ${parts.join('; ')}.`;
};
