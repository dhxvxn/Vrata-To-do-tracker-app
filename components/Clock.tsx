import React, { useEffect, useState } from 'react';

// A minimalist live clock: HH:MM:SS + weekday · full date. Uses device time.
export const Clock: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const weekday = now.toLocaleDateString([], { weekday: 'long' });
  const date = now.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="mb-8">
      <div className="text-5xl sm:text-6xl font-extralight text-white tabular-nums tracking-tight leading-none">{time}</div>
      <div className="text-sm text-zinc-500 mt-2 uppercase tracking-[0.2em]">{weekday} · {date}</div>
    </div>
  );
};
