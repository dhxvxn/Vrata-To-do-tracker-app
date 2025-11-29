import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ProgressData } from '../types';

interface ProgressChartProps {
  data: ProgressData[];
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ data }) => {
  return (
    <div className="w-full h-64 bg-surfaceHighlight/30 border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-textMuted mb-4 uppercase tracking-widest">
        Velocity
      </h3>
      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: -20, bottom: 0 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#27272a" 
            />
            <XAxis 
              dataKey="date" 
              stroke="#52525b" 
              tick={{ fill: '#52525b', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#52525b"
              tick={{ fill: '#52525b', fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#09090b',
                borderColor: '#27272a',
                color: '#fafafa',
              }}
              itemStyle={{ color: '#fafafa' }}
              cursor={{ stroke: '#3f3f46' }}
            />
            <Line
              type="monotone"
              dataKey="completionRate"
              stroke="#fafafa"
              strokeWidth={2}
              dot={{ fill: '#000000', stroke: '#fafafa', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#fafafa' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};