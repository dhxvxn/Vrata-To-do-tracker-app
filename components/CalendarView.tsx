import React, { useCallback, useEffect, useState } from 'react';
import { CalendarClock, RefreshCw, LogOut, Loader2, AlertCircle } from 'lucide-react';
import {
  isGoogleConfigured,
  wasConnected,
  isSignedIn,
  signIn,
  signOut,
} from '../services/googleAuthService';
import { listUpcomingEvents, CalendarEvent } from '../services/calendarService';

const formatWhen = (event: CalendarEvent): string => {
  if (event.start?.dateTime) {
    return new Date(event.start.dateTime).toLocaleString([], {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
  if (event.start?.date) {
    return `${new Date(`${event.start.date}T00:00:00`).toLocaleDateString([], {
      weekday: 'short', month: 'short', day: 'numeric',
    })} · all day`;
  }
  return '';
};

export const CalendarView: React.FC = () => {
  const configured = isGoogleConfigured();
  const [connected, setConnected] = useState(isSignedIn());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(await listUpcomingEvents(15));
      setConnected(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to load calendar.');
    } finally {
      setLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    try {
      await signIn();
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Google sign-in failed.');
    }
  }, [refresh]);

  const disconnect = useCallback(() => {
    signOut();
    setConnected(false);
    setEvents([]);
  }, []);

  // If the user connected in a previous session, load automatically.
  useEffect(() => {
    if (configured && isSignedIn()) refresh();
  }, [configured, refresh]);

  if (!configured) {
    return (
      <div className="border border-dashed border-border rounded-lg p-8 text-center space-y-3">
        <AlertCircle className="mx-auto text-zinc-600" size={22} />
        <p className="text-sm text-zinc-400 font-light max-w-md mx-auto">
          Google Calendar isn't configured yet. Add a <span className="text-white font-mono text-xs">VITE_GOOGLE_CLIENT_ID</span> to
          your <span className="text-white font-mono text-xs">.env.local</span> (see <span className="text-white font-mono text-xs">.env.local.example</span>) and restart the dev server.
        </p>
      </div>
    );
  }

  if (!connected && !wasConnected()) {
    return (
      <div className="border border-border rounded-lg p-8 text-center space-y-4 bg-surface">
        <CalendarClock className="mx-auto text-white" size={26} />
        <div>
          <h3 className="text-white font-medium">Connect Google Calendar</h3>
          <p className="text-sm text-zinc-500 mt-1 font-light">See your schedule here and push tasks &amp; exams to your calendar.</p>
        </div>
        <button
          onClick={connect}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-colors"
        >
          <CalendarClock size={16} /> Connect
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">Upcoming</span>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={loading} className="text-zinc-500 hover:text-white p-2 disabled:opacity-40" title="Refresh">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          </button>
          <button onClick={disconnect} className="text-zinc-600 hover:text-red-400 p-2" title="Disconnect">
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{error} You may need to sign in again.</span>
        </div>
      )}

      {!loading && events.length === 0 && !error ? (
        <div className="text-center py-16 text-zinc-700 font-light border border-dashed border-border rounded-lg">
          No upcoming events on your calendar.
        </div>
      ) : (
        <div className="space-y-2">
          {events.map(event => (
            <a
              key={event.id}
              href={event.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-surface border border-transparent hover:border-border rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-white/70 rounded-full flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm text-zinc-200 truncate">{event.summary || '(No title)'}</div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{formatWhen(event)}</div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
