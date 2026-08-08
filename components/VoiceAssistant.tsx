import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, Loader2, X, Sparkles } from 'lucide-react';
import { Task, VoiceCommandResult } from '../types';
import { parseVoiceCommand } from '../services/geminiService';
import {
  createRecognition,
  speak,
  isVoiceSupported,
  isSpeechSynthesisSupported,
} from '../services/voiceService';

interface VoiceAssistantProps {
  activeTabLabel: string;
  taskTitles: string[];
  onAddTask: (result: VoiceCommandResult) => void;
  onCompleteTask: (title: string) => Task | undefined;
  onDeleteTask: (title: string) => Task | undefined;
  getTasksSummary: () => string;
  getScheduleSummary?: () => Promise<string>;
}

type Status = 'idle' | 'listening' | 'thinking' | 'speaking';

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  activeTabLabel,
  taskTitles,
  onAddTask,
  onCompleteTask,
  onDeleteTask,
  getTasksSummary,
  getScheduleSummary,
}) => {
  const supported = useMemo(() => isVoiceSupported(), []);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const controllerRef = useRef<ReturnType<typeof createRecognition>>(null);

  const respond = useCallback((text: string) => {
    setReply(text);
    if (isSpeechSynthesisSupported()) {
      setStatus('speaking');
      speak(text);
      // We don't track synthesis end precisely; settle back to idle shortly.
      window.setTimeout(() => setStatus('idle'), 400);
    } else {
      setStatus('idle');
    }
  }, []);

  const execute = useCallback(async (result: VoiceCommandResult) => {
    switch (result.intent) {
      case 'ADD_TASK': {
        if (!result.title) { respond("I didn't catch what to add."); return; }
        onAddTask(result);
        respond(result.reply || `Added "${result.title}".`);
        return;
      }
      case 'COMPLETE_TASK': {
        const match = result.title ? onCompleteTask(result.title) : undefined;
        respond(match ? (result.reply || `Marked "${match.title}" as done.`)
                      : `I couldn't find a task called "${result.title ?? ''}".`);
        return;
      }
      case 'DELETE_TASK': {
        const match = result.title ? onDeleteTask(result.title) : undefined;
        respond(match ? (result.reply || `Deleted "${match.title}".`)
                      : `I couldn't find a task called "${result.title ?? ''}".`);
        return;
      }
      case 'QUERY_SCHEDULE': {
        if (!getScheduleSummary) { respond('Connect Google Calendar to check your schedule.'); return; }
        setStatus('thinking');
        try {
          respond(await getScheduleSummary());
        } catch {
          respond('I could not reach your calendar right now.');
        }
        return;
      }
      case 'QUERY_TASKS': {
        respond(getTasksSummary());
        return;
      }
      default:
        respond(result.reply);
    }
  }, [onAddTask, onCompleteTask, onDeleteTask, getScheduleSummary, getTasksSummary, respond]);

  const handleTranscript = useCallback(async (text: string) => {
    setTranscript(text);
    setStatus('thinking');
    const result = await parseVoiceCommand(text, { activeTabLabel, taskTitles });
    await execute(result);
  }, [activeTabLabel, taskTitles, execute]);

  const startListening = useCallback(() => {
    setReply('');
    setTranscript('');
    const controller = createRecognition({
      onResult: handleTranscript,
      onError: (msg) => {
        setStatus('idle');
        if (msg === 'not-allowed' || msg === 'service-not-allowed') {
          setReply('Microphone access was blocked. Allow it in your browser to use voice.');
        }
      },
      onEnd: () => {
        // If recognition ended without a result, go back to idle.
        setStatus(prev => (prev === 'listening' ? 'idle' : prev));
      },
    });
    controllerRef.current = controller;
    if (controller) {
      setStatus('listening');
      controller.start();
    }
  }, [handleTranscript]);

  const stopListening = useCallback(() => {
    controllerRef.current?.stop();
    setStatus('idle');
  }, []);

  const toggleMic = () => {
    if (status === 'listening') stopListening();
    else startListening();
  };

  const statusLabel: Record<Status, string> = {
    idle: 'Tap the mic and speak',
    listening: 'Listening…',
    thinking: 'Thinking…',
    speaking: 'Responding…',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-72 sm:w-80 bg-surface border border-border rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-white">
              <Sparkles size={15} />
              <span className="text-xs font-bold uppercase tracking-widest">Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-white p-1">
              <X size={15} />
            </button>
          </div>

          {!supported ? (
            <p className="text-xs text-zinc-500 leading-relaxed">
              Voice input isn't supported in this browser. Try Chrome or Edge on desktop.
            </p>
          ) : (
            <>
              <p className="text-[11px] text-zinc-500 h-4">{statusLabel[status]}</p>
              {transcript && (
                <div className="mt-2 text-sm text-zinc-300">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-0.5">You</span>
                  "{transcript}"
                </div>
              )}
              {reply && (
                <div className="mt-3 text-sm text-white bg-surfaceHighlight rounded-lg p-3">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-0.5">Vrata</span>
                  {reply}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={toggleMic}
                  disabled={status === 'thinking'}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 ${
                    status === 'listening' ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-zinc-200'
                  }`}
                >
                  {status === 'thinking'
                    ? <><Loader2 size={14} className="animate-spin" /> Working</>
                    : status === 'listening'
                      ? <><MicOff size={14} /> Stop</>
                      : <><Mic size={14} /> Speak</>}
                </button>
              </div>
              <p className="mt-2 text-[10px] text-zinc-600 leading-relaxed">
                Try: "add a daily task to revise calculus", "mark laundry done", or "what's on my schedule".
              </p>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => { setOpen(o => !o); if (!open && supported && status === 'idle') startListening(); }}
        title="Voice assistant"
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${
          status === 'listening'
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-white text-black hover:scale-105'
        }`}
      >
        {supported ? <Mic size={22} /> : <MicOff size={22} />}
      </button>
    </div>
  );
};
