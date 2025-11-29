import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { TaskFrequency } from '../types';

interface TaskInputProps {
  onAdd: (title: string, frequency: TaskFrequency) => void;
  selectedFrequency: TaskFrequency;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAdd, selectedFrequency }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text, selectedFrequency);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative group">
      <div className="flex items-center bg-surface border border-border rounded-lg overflow-hidden focus-within:border-textMuted transition-colors duration-200">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Add a ${selectedFrequency.toLowerCase()} task...`}
          className="flex-1 bg-transparent border-none text-textMain px-4 py-3 focus:ring-0 placeholder-zinc-600 outline-none"
        />
        <button
          type="submit"
          className="p-3 text-zinc-500 hover:text-white transition-colors"
          disabled={!text.trim()}
        >
          <Plus size={20} />
        </button>
      </div>
    </form>
  );
};