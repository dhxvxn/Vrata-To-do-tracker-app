
import { GoogleGenAI } from "@google/genai";
import { Task, TaskFrequency, Quote } from "../types";

const MODEL = 'gemini-3-flash-preview';

// The Gemini key is OPTIONAL. vite.config defines process.env.API_KEY from
// GEMINI_API_KEY in .env.local. Without a key, every function below falls back
// to local, keyless output so the app is fully usable for free.
const getApiKey = (): string | undefined => {
  try { return process.env.API_KEY || undefined; } catch { return undefined; }
};
export const isGeminiConfigured = (): boolean => !!getApiKey();

// Lazily create the client only when a key exists (constructing it with no key
// can throw, which would crash the app on import).
const getAi = (): GoogleGenAI | null => {
  const key = getApiKey();
  return key ? new GoogleGenAI({ apiKey: key }) : null;
};

// ---- Local, keyless fallbacks ----

export const buildLocalInsight = (tasks: Task[]): string => {
  if (tasks.length === 0) return 'A clean slate. Define one target and begin.';
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const rate = Math.round((done / total) * 100);
  const exam = tasks.filter(t => t.frequency === TaskFrequency.EXAM);
  if (exam.length && exam.filter(t => t.completed).length < exam.length) {
    return `Exam season is live. ${exam.length - exam.filter(t => t.completed).length} prep tasks remain. Discipline compounds.`;
  }
  if (rate >= 80) return `${rate}% cleared. Execution is sharp. Protect the streak.`;
  return `${done} of ${total} done — ${rate}%. Close the open loops one at a time.`;
};

const LOCAL_QUOTES: Record<'GENERAL' | 'EXAM' | 'FITNESS', Quote[]> = {
  GENERAL: [
    { text: 'Waste no more time arguing what a good man should be. Be one.', author: 'Marcus Aurelius' },
    { text: 'We suffer more often in imagination than in reality.', author: 'Seneca' },
    { text: 'Well begun is half done.', author: 'Aristotle' },
  ],
  EXAM: [
    { text: 'The roots of education are bitter, but the fruit is sweet.', author: 'Aristotle' },
    { text: 'Knowing yourself is the beginning of all wisdom.', author: 'Aristotle' },
  ],
  FITNESS: [
    { text: 'It is not the mountain we conquer but ourselves.', author: 'Edmund Hillary' },
    { text: 'The body achieves what the mind believes.', author: 'Napoleon Hill' },
  ],
};

const localQuote = (category: 'GENERAL' | 'EXAM' | 'FITNESS'): Quote => {
  const list = LOCAL_QUOTES[category] || LOCAL_QUOTES.GENERAL;
  // Rotate by day so it feels fresh without a key.
  const idx = new Date().getDate() % list.length;
  return list[idx];
};

// ---- Gemini-backed (with local fallback) ----

export const getProductivityInsight = async (tasks: Task[]): Promise<string> => {
  const ai = getAi();
  if (!ai) return buildLocalInsight(tasks);
  try {
    const done = tasks.filter(t => t.completed).length;
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Stoic analyst. Brief insight on: Tasks ${done}/${tasks.length}. Under 20 words. Minimalist.`,
    });
    return response.text || buildLocalInsight(tasks);
  } catch {
    return buildLocalInsight(tasks);
  }
};

export const getDailyQuote = async (category: 'GENERAL' | 'EXAM' | 'FITNESS'): Promise<Quote> => {
  const ai = getAi();
  if (!ai) return localQuote(category);
  try {
    const today = new Date().toDateString();
    const focus = category === 'EXAM'
      ? 'learning, intelligence, focus, or socratic wisdom'
      : category === 'FITNESS'
        ? 'physical strength, the body, endurance, or the will to push boundaries'
        : 'discipline, time management, stoicism, or the value of action';

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Provide a famous philosopher quote about ${focus}.
      Format strictly as JSON: { "text": "quote text here", "author": "Philosopher Name" }.
      Context: Today is ${today}. Make it unique and motivating for a minimalist dark theme.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '') as Quote;
  } catch {
    return localQuote(category);
  }
};

export const generateWrappedReport = async (tasks: Task[], period: 'MONTH' | 'YEAR'): Promise<string> => {
  const ai = getAi();
  const done = tasks.filter(t => t.completed).length;
  const fitness = tasks.filter(t => t.frequency === TaskFrequency.FITNESS && t.completed).length;
  const localReport = `A ${period.toLowerCase()} of ${done} completed ${done === 1 ? 'task' : 'tasks'}${fitness ? `, including ${fitness} fitness ${fitness === 1 ? 'session' : 'sessions'}` : ''}. Discipline, etched into the record.`;
  if (!ai) return localReport;
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Analyze this ${period} for a Vrata user:
      Total Tasks: ${tasks.length}, Completed: ${done}, Fitness sessions: ${fitness}.
      Write a "Wrapped" style summary. Be poetic, slightly dark, and highly motivating.
      Call out their best category. Keep it under 60 words. No emojis.`,
    });
    return response.text || localReport;
  } catch {
    return localReport;
  }
};
