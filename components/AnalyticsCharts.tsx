import React from 'react';
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
