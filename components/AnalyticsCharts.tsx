import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { FocusSession } from '../types';

// --- Colors matching the Vrata theme ---
const COLORS = {
  white: '#fafafa',
  zinc500: '#71717a',
  zinc800: '#27272a',
  zinc900: '#18181b',
  black: '#000000',
};

// --- Custom Tooltip Component ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 p-3 rounded shadow-xl">
        <p className="text-zinc-400 text-xs mb-1 uppercase tracking-wider">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-zinc-200">
              {entry.name}: <span className="font-mono">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Category Bar Chart ---
interface CategoryData {
  name: string;
  total: number;
  completed: number;
}

export const CategoryBarChart: React.FC<{ data: CategoryData[] }> = ({ data }) => {
  return (
    <div className="w-full h-64 bg-surfaceHighlight/30 border border-border rounded-lg p-4 flex flex-col">
      <h3 className="text-sm font-medium text-textMuted mb-4 uppercase tracking-widest">
        Performance by Frequency
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            barGap={8}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.zinc800} />
            <XAxis 
              dataKey="name" 
              stroke={COLORS.zinc500} 
              tick={{ fill: COLORS.zinc500, fontSize: 12 }} 
              axisLine={false} 
              tickLine={false} 
              dy={10}
            />
            <YAxis 
              stroke={COLORS.zinc500} 
              tick={{ fill: COLORS.zinc500, fontSize: 12 }} 
              axisLine={false} 
              tickLine={false} 
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: COLORS.zinc900 }} />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: COLORS.zinc500 }}
            />
            <Bar 
              dataKey="total" 
              name="Total Tasks" 
              fill={COLORS.zinc800} 
              radius={[4, 4, 0, 0]} 
              barSize={32}
            />
            <Bar
              dataKey="completed"
              name="Completed"
              fill={COLORS.white}
              radius={[4, 4, 0, 0]}
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- Focus Minutes Chart (last 7 days) ---
export const FocusChart: React.FC<{ sessions: FocusSession[] }> = ({ sessions }) => {
  const data = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    return days.map(date => {
      const minutes = sessions
        .filter(s => (s.date || '').split('T')[0] === date)
        .reduce((sum, s) => sum + s.minutes, 0);
      const parts = date.split('-');
      return { date: `${parts[1]}/${parts[2]}`, minutes };
    });
  }, [sessions]);

  const total = data.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <div className="w-full h-64 bg-surfaceHighlight/30 border border-border rounded-lg p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-textMuted uppercase tracking-widest">Focus Minutes</h3>
        <span className="text-[10px] text-zinc-600 font-mono">{total} min this week</span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.zinc800} />
            <XAxis dataKey="date" stroke={COLORS.zinc500} tick={{ fill: COLORS.zinc500, fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis stroke={COLORS.zinc500} tick={{ fill: COLORS.zinc500, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: COLORS.zinc900 }} />
            <Bar dataKey="minutes" name="Minutes" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
