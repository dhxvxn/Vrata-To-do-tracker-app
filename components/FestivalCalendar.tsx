import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, PartyPopper, Loader2 } from 'lucide-react';
import { fetchIndianHolidays, Holiday } from '../services/holidaysService';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const todayKey = () => new Date().toISOString().split('T')[0];
const daysUntil = (dateStr: string): number => {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${dateStr}T00:00:00`).getTime() - t.getTime()) / 86_400_000);
};

// A month calendar of Indian holidays & festivals plus an upcoming list.
export const FestivalCalendar: React.FC = () => {
  const now = new Date();
  const [view, setView] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const y = now.getFullYear();
    Promise.all([fetchIndianHolidays(y), fetchIndianHolidays(y + 1)])
      .then(([a, b]) => { if (active) setHolidays([...a, ...b]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byDate = useMemo(() => {
    const m = new Map<string, string>();
    holidays.forEach(h => { if (!m.has(h.date)) m.set(h.date, h.name); });
    return m;
  }, [holidays]);

  const upcoming = useMemo(() =>
    holidays
      .map(h => ({ ...h, days: daysUntil(h.date) }))
      .filter(h => h.days >= 0)
      .sort((a, b) => a.days - b.days)
      .slice(0, 8),
  [holidays]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const dateKey = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-3">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">{MONTHS[month]} {year}</h3>
            <div className="flex items-center gap-1">
              <button onClick={() => setView(new Date(year, month - 1, 1))} className="p-1.5 text-zinc-500 hover:text-white rounded"><ChevronLeft size={16} /></button>
              <button onClick={() => setView(new Date(now.getFullYear(), now.getMonth(), 1))} className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white px-2">Today</button>
              <button onClick={() => setView(new Date(year, month + 1, 1))} className="p-1.5 text-zinc-500 hover:text-white rounded"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAYS.map(d => <div key={d} className="text-[10px] uppercase tracking-widest text-zinc-600 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const key = dateKey(d);
              const holiday = byDate.get(key);
              const isToday = key === todayKey();
              return (
                <div key={i} title={holiday || ''}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative ${isToday ? 'bg-white text-black font-bold' : holiday ? 'bg-surfaceHighlight text-white' : 'text-zinc-400'}`}>
                  {d}
                  {holiday && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-400" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">
          <PartyPopper size={13} /> Upcoming holidays & festivals
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-zinc-600 p-3"><Loader2 size={14} className="animate-spin" /> Loading…</div>
        ) : upcoming.length === 0 ? (
          <div className="text-xs text-zinc-600 p-3">No upcoming holidays found.</div>
        ) : (
          upcoming.map(h => (
            <div key={`${h.date}-${h.name}`} className="flex items-center gap-3 p-3 bg-surface border border-transparent hover:border-border rounded-lg transition-colors">
              <div className="w-2 h-8 rounded-full bg-amber-400/70 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-zinc-200 truncate">{h.name}</div>
                <div className="text-[11px] text-zinc-500 font-mono">{new Date(`${h.date}T00:00:00`).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-light text-white leading-none">{h.days === 0 ? 'Today' : h.days}</div>
                {h.days > 0 && <div className="text-[9px] uppercase tracking-widest text-zinc-600">day{h.days === 1 ? '' : 's'}</div>}
              </div>
            </div>
          ))
        )}
        <p className="text-[10px] text-zinc-600 pt-1">Holiday data for India via the public Nager.Date calendar.</p>
      </div>
    </div>
  );
};
