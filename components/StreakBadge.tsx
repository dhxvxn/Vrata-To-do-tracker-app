import React from 'react';
import { Flame } from 'lucide-react';
import { XPState } from '../utils/stats';

interface StreakBadgeProps {
  streak: number;
  xp: XPState;
}

// Compact streak flame + level/XP bar for the sidebar.
export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, xp }) => (
  <div className="px-4 py-3 rounded-lg bg-surface border border-border space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Flame size={16} className={streak > 0 ? 'text-orange-400' : 'text-zinc-600'} fill={streak > 0 ? '#fb923c' : 'none'} />
        <span className="text-sm text-zinc-200 font-semibold">{streak}</span>
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">day{streak === 1 ? '' : 's'}</span>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-zinc-500">Lv {xp.level}</span>
    </div>
    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div className="h-full bg-white rounded-full transition-all" style={{ width: `${(xp.intoLevel / xp.forNextLevel) * 100}%` }} />
    </div>
    <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
      <span>{xp.xp} XP</span>
      <span>{xp.forNextLevel - xp.intoLevel} to Lv {xp.level + 1}</span>
    </div>
  </div>
);
