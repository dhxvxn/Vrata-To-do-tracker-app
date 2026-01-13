
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Pin } from 'lucide-react';
import { ExamEvent, Task, TaskFrequency } from '../types';

interface ExamCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  examEvents: ExamEvent[];
  tasks: Task[];
  onPinExam: (title: string, date: string, color: string) => void;
}

const EXAM_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#6366f1', // Indigo
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#ec4899', // Pink
  '#06b6d4', // Cyan
];

export const ExamCalendar: React.FC<ExamCalendarProps> = ({ 
  selectedDate, 
  onSelectDate, 
  examEvents,
  tasks,
  onPinExam
}) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const [pinMode, setPinMode] = useState(false);
  const [pinTitle, setPinTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(EXAM_COLORS[0]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const days = [];
  const totalDays = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  // Padding for start of month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`pad-${i}`} className="h-10 w-full" />);
  }

  for (let d = 1; d <= totalDays; d++) {
    const currentIterDate = new Date(year, month, d);
    const dateStr = currentIterDate.toISOString().split('T')[0];
    const isSelected = selectedDate.toDateString() === currentIterDate.toDateString();
    const isToday = today.toDateString() === currentIterDate.toDateString();
    
    const examEvent = examEvents.find(e => e.date === dateStr);
    const taskCount = tasks.filter(t => t.frequency === TaskFrequency.EXAM && t.scheduledDate === dateStr).length;

    days.push(
      <button
        key={d}
        onClick={() => onSelectDate(currentIterDate)}
        className={`relative h-12 w-full flex flex-col items-center justify-center rounded-md text-sm transition-all group ${
          isSelected 
            ? 'bg-white text-black font-bold' 
            : 'text-textMuted hover:bg-surfaceHighlight hover:text-white'
        } ${isToday && !isSelected ? 'border border-zinc-700' : ''}`}
      >
        <span>{d}</span>
        
        {/* Exam Pin Indicator */}
        {examEvent && (
          <div 
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full shadow-sm" 
            style={{ backgroundColor: isSelected ? '#000000' : examEvent.color }}
          />
        )}

        {/* Task Count Badge */}
        {taskCount > 0 && (
          <span 
            className={`absolute bottom-1 text-[8px] font-mono leading-none px-1 rounded-sm ${
              isSelected ? 'bg-black/10 text-black' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-200'
            }`}
          >
            {taskCount}
          </span>
        )}
      </button>
    );
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinTitle.trim()) {
      onPinExam(pinTitle, selectedDate.toISOString().split('T')[0], selectedColor);
      setPinTitle('');
      setPinMode(false);
    }
  };

  const currentExam = examEvents.find(e => e.date === selectedDate.toISOString().split('T')[0]);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 w-full select-none">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium text-white px-2">
          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-surfaceHighlight rounded-lg text-textMuted hover:text-white">
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextMonth} className="p-1.5 hover:bg-surfaceHighlight rounded-lg text-textMuted hover:text-white">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="h-8 w-full flex items-center justify-center text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>

      <div className="mt-6 pt-4 border-t border-border flex flex-col gap-3">
        {pinMode ? (
          <form onSubmit={handlePinSubmit} className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
            <input 
              autoFocus
              className="w-full bg-black border border-border rounded-md px-3 py-1.5 text-xs text-white outline-none focus:border-zinc-500"
              placeholder="Exam title..."
              value={pinTitle}
              onChange={e => setPinTitle(e.target.value)}
            />
            <div className="flex flex-wrap items-center justify-between gap-y-3">
              <div className="grid grid-cols-5 gap-1.5">
                {EXAM_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-4 h-4 rounded-full border-2 transition-transform ${selectedColor === color ? 'scale-125 border-zinc-400' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-3 py-1.5 bg-white text-black text-[10px] font-bold uppercase tracking-wider rounded-md">Pin</button>
                <button type="button" onClick={() => setPinMode(false)} className="px-3 py-1.5 text-zinc-500 text-[10px] uppercase tracking-wider">Cancel</button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-xs text-textMuted flex items-center gap-2 max-w-[70%] overflow-hidden">
              <span className="font-mono flex-shrink-0">{selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              {currentExam && (
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: currentExam.color }} />
                  <span className="text-white font-medium truncate">— {currentExam.title}</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => {
                setPinMode(true);
                if (currentExam) {
                  setPinTitle(currentExam.title);
                  setSelectedColor(currentExam.color);
                }
              }}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors whitespace-nowrap"
            >
              <Pin size={12} />
              {currentExam ? 'Edit' : 'Pin Exam'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
