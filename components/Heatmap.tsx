import React, { useMemo } from 'react';
import { Task } from '../types';
import { heatmapData } from '../utils/stats';

const levelColor = (count: number): string => {
  if (count <= 0) return '#18181b';      // zinc-900
  if (count === 1) return '#14532d';     // green-900
  if (count <= 3) return '#16a34a';      // green-600
  if (count <= 5) return '#22c55e';      // green-500
  return '#4ade80';                      // green-400
};

interface HeatmapProps {
  tasks: Task[];
}

// A GitHub-style contribution grid: one square per day for the past year,
// coloured by how many tasks were completed that day.
export const Heatmap: React.FC<HeatmapProps> = ({ tasks }) => {
  const cells = useMemo(() => heatmapData(tasks, 371), [tasks]);

  // Pad the front so the first column starts on Sunday (getDay() 0).
  const firstDay = cells.length ? new Date(`${cells[0].date}T00:00:00`).getDay() : 0;
  const padded: (typeof cells[number] | null)[] = [...Array(firstDay).fill(null), ...cells];
  const total = tasks.filter(t => t.completed).length;

  return (
    <div className="w-full bg-surfaceHighlight/30 border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-textMuted uppercase tracking-widest">Consistency</h3>
        <span className="text-[10px] text-zinc-600 font-mono">{total} completed · last 12 months</span>
      </div>
      <div className="overflow-x-auto">
        <div
          className="grid grid-flow-col gap-[3px]"
          style={{ gridTemplateRows: 'repeat(7, 10px)', gridAutoColumns: '10px' }}
        >
          {padded.map((cell, i) => (
            <div
              key={i}
              title={cell ? `${cell.date}: ${cell.count} completed` : ''}
              className="w-[10px] h-[10px] rounded-[2px]"
              style={{ backgroundColor: cell ? levelColor(cell.count) : 'transparent' }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-3 text-[9px] text-zinc-600">
        <span>Less</span>
        {[0, 1, 3, 5, 6].map(c => (
          <div key={c} className="w-[10px] h-[10px] rounded-[2px]" style={{ backgroundColor: levelColor(c) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};
