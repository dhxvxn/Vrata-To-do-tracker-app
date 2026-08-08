
import { GoogleGenAI } from "@google/genai";
import { Task, TaskFrequency, VoiceCommandResult, VoiceIntentType } from "../types";

const MODEL = 'gemini-3-flash-preview';

// Read the key from Vite env (VITE_GEMINI_API_KEY), falling back to a legacy
// process.env value if one was injected. Kept in one place so every call uses
// the same resolution.
const getApiKey = (): string | undefined =>
  import.meta.env.VITE_GEMINI_API_KEY ||
  (typeof process !== 'undefined' ? (process as any).env?.API_KEY : undefined);

export const isGeminiConfigured = (): boolean => !!getApiKey();

export const getProductivityInsight = async (tasks: Task[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    const completedCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;

    const daily = tasks.filter(t => t.frequency === TaskFrequency.DAILY);
    const weekly = tasks.filter(t => t.frequency === TaskFrequency.WEEKLY);
    const exam = tasks.filter(t => t.frequency === TaskFrequency.EXAM);

    const summary = `
      Total Tasks: ${totalCount}
      Completed: ${completedCount}
      Daily Tasks: ${daily.length} (${daily.filter(t => t.completed).length} done)
      Weekly Tasks: ${weekly.length} (${weekly.filter(t => t.completed).length} done)
      Exam Prep Tasks: ${exam.length} (${exam.filter(t => t.completed).length} done)
    `;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `
        You are a minimalist, stoic productivity coach.
        Analyze this user's task data:
        ${summary}

        Provide a very brief, high-impact insight or observation about their progress.
        If they have Exam tasks, acknowledge the high-stakes season with a focus on discipline.
        Keep it under 30 words.
        Style: Direct, professional, slightly dark/minimalist aesthetic.
        No emojis.
      `,
    });

    return response.text || "Focus on the essential. Completion is the only metric.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to analyze patterns at this moment. Keep moving forward.";
  }
};

export interface VoiceContext {
  activeTabLabel: string;
  taskTitles: string[];
}

const VALID_INTENTS: VoiceIntentType[] = [
  'ADD_TASK', 'COMPLETE_TASK', 'DELETE_TASK', 'QUERY_SCHEDULE', 'QUERY_TASKS', 'UNKNOWN',
];
const VALID_FREQUENCIES = Object.values(TaskFrequency);

/**
 * Turn a raw voice transcript into a structured command the app can execute.
 * Uses Gemini with a JSON response; falls back to UNKNOWN on any error so the
 * assistant always has something safe to say.
 */
export const parseVoiceCommand = async (
  transcript: string,
  context: VoiceContext
): Promise<VoiceCommandResult> => {
  const fallback: VoiceCommandResult = {
    intent: 'UNKNOWN',
    reply: "Sorry, I didn't catch that. Try 'add a daily task to ...' or 'what's on my schedule'.",
  };

  if (!getApiKey()) {
    return {
      intent: 'UNKNOWN',
      reply: 'Voice commands need a Gemini API key. Add VITE_GEMINI_API_KEY to your .env.local.',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const today = new Date().toISOString().split('T')[0];

    const prompt = `You are the command parser for "Vrata", a to-do and study tracker.
Today's date is ${today}. The user is viewing the "${context.activeTabLabel}" section.
Existing task titles the user might refer to: ${context.taskTitles.slice(0, 40).map(t => `"${t}"`).join(', ') || '(none)'}.

The user said (via speech): "${transcript}"

Decide what they want and respond with ONLY a JSON object (no markdown, no code fences) with these fields:
- "intent": one of ADD_TASK, COMPLETE_TASK, DELETE_TASK, QUERY_SCHEDULE, QUERY_TASKS, UNKNOWN
- "title": for ADD/COMPLETE/DELETE, the task title (for COMPLETE/DELETE match an existing title above when possible)
- "frequency": for ADD_TASK, one of DAILY, WEEKLY, MONTHLY, EXAM, RUNNING, STUDY (infer from wording; default DAILY)
- "details": optional extra detail for ADD_TASK
- "date": optional YYYY-MM-DD if the user named a specific day
- "reply": a short, friendly spoken confirmation or answer (one sentence, no emojis)

Guidance: "study", "watch", "youtube", "lecture", "revise a topic" -> STUDY. "run", "km", "jog", "tempo" -> RUNNING. "exam", "test prep" -> EXAM. Questions about calendar/agenda/meetings -> QUERY_SCHEDULE. Questions about what's left/to-do today -> QUERY_TASKS.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const raw = (response.text || '').trim().replace(/^```json\s*/i, '').replace(/```$/,'').trim();
    const parsed = JSON.parse(raw);

    const intent: VoiceIntentType = VALID_INTENTS.includes(parsed.intent) ? parsed.intent : 'UNKNOWN';
    const frequency = VALID_FREQUENCIES.includes(parsed.frequency) ? parsed.frequency as TaskFrequency : undefined;

    return {
      intent,
      title: typeof parsed.title === 'string' ? parsed.title.trim() : undefined,
      frequency,
      details: typeof parsed.details === 'string' && parsed.details.trim() ? parsed.details.trim() : undefined,
      date: typeof parsed.date === 'string' ? parsed.date.trim() : undefined,
      reply: typeof parsed.reply === 'string' && parsed.reply.trim() ? parsed.reply.trim() : fallback.reply,
    };
  } catch (error) {
    console.error('parseVoiceCommand error:', error);
    return fallback;
  }
};
