import React, { useState } from 'react';
import { CheckCircle2, Circle, Trash2, Play, X, ExternalLink } from 'lucide-react';
import { Task } from '../types';
import { thumbnailUrl, embedUrl, watchUrl } from '../utils/youtube';

interface StudyCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const StudyCard: React.FC<StudyCardProps> = ({ task, onToggle, onDelete }) => {
  const [playing, setPlaying] = useState(false);
  const videoId = task.youtubeVideoId;

  return (
    <div className={`group bg-surface border border-transparent rounded-lg overflow-hidden transition-all ${task.completed ? 'opacity-50 grayscale' : 'hover:border-border'}`}>
      <div className="flex gap-4 p-4">
        {videoId && (
          <button
            onClick={() => setPlaying(true)}
            className="relative flex-shrink-0 w-28 sm:w-36 aspect-video rounded-md overflow-hidden bg-black group/thumb"
            title="Watch"
          >
            <img src={thumbnailUrl(videoId)} alt="" className="w-full h-full object-cover" loading="lazy" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/thumb:bg-black/50 transition-colors">
              <Play size={22} className="text-white" fill="white" />
            </span>
          </button>
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => onToggle(task.id)} className="flex items-center justify-center w-6 h-6 flex-shrink-0 group/btn">
                {task.completed ? <CheckCircle2 size={20} className="text-zinc-500" /> : <Circle size={20} className="text-zinc-400 group-hover/btn:text-zinc-200" />}
              </button>
              <span className={`text-sm sm:text-base truncate ${task.completed ? 'text-zinc-600 line-through' : 'text-zinc-200'}`}>
                {task.title}
              </span>
            </div>
            <button onClick={() => onDelete(task.id)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 p-1 flex-shrink-0">
              <Trash2 size={15} />
            </button>
          </div>

          {task.details && !task.completed && (
            <div className="ml-9 mt-2 space-y-1">
              {task.details.split('\n').map((line, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-zinc-500 font-light leading-relaxed">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-zinc-800 flex-shrink-0" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          )}

          {videoId && (
            <div className="ml-9 mt-auto pt-2 flex items-center gap-4">
              <button onClick={() => setPlaying(true)} className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white flex items-center gap-1.5">
                <Play size={12} /> Watch here
              </button>
              <a href={watchUrl(videoId)} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 hover:text-white flex items-center gap-1.5">
                <ExternalLink size={12} /> YouTube
              </a>
            </div>
          )}
        </div>
      </div>

      {playing && videoId && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setPlaying(false)}>
          <div className="w-full max-w-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-zinc-300 truncate pr-4">{task.title}</span>
              <button onClick={() => setPlaying(false)} className="text-zinc-400 hover:text-white p-1"><X size={20} /></button>
            </div>
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
              <iframe
                src={`${embedUrl(videoId)}?autoplay=1`}
                title={task.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
