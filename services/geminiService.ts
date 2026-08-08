
import { GoogleGenAI } from "@google/genai";
import { Task, TaskFrequency } from "../types";

const MODEL = 'gemini-3-flash-preview';

// Read the key from Vite env (VITE_GEMINI_API_KEY), falling back to a legacy
// process.env value if one was injected. The key is OPTIONAL — without it the
// app falls back to a locally-generated insight.
const getApiKey = (): string | undefined =>
  import.meta.env.VITE_GEMINI_API_KEY ||
  (typeof process !== 'undefined' ? (process as any).env?.API_KEY : undefined);

export const isGeminiConfigured = (): boolean => !!getApiKey();

// A keyless, templated insight built purely from the user's own stats. Used when
// no Gemini key is configured (i.e. the default, free experience) and as the
// fallback if the API call fails.
export const buildLocalInsight = (tasks: Task[]): string => {
  if (tasks.length === 0) {
    return 'A clean slate. Define one target and begin. Momentum follows the first move.';
  }

  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const rate = Math.round((completed / total) * 100);

  const byFreq = (f: TaskFrequency) => {
    const list = tasks.filter(t => t.frequency === f);
    return { total: list.length, done: list.filter(t => t.completed).length };
  };
  const exam = byFreq(TaskFrequency.EXAM);
  const study = byFreq(TaskFrequency.STUDY);

  // Find the category dragging completion down the most.
  const categories: { name: string; total: number; done: number }[] = [
    { name: 'daily', ...byFreq(TaskFrequency.DAILY) },
    { name: 'weekly', ...byFreq(TaskFrequency.WEEKLY) },
    { name: 'monthly', ...byFreq(TaskFrequency.MONTHLY) },
    { name: 'exam', ...exam },
    { name: 'study', ...study },
  ].filter(c => c.total > 0);

  const laggard = categories
    .map(c => ({ ...c, pct: c.done / c.total }))
    .sort((a, b) => a.pct - b.pct)[0];

  if (exam.total > 0 && exam.done < exam.total) {
    return `Exam season is live: ${exam.total - exam.done} of ${exam.total} prep tasks remain. Discipline now compounds later. Hold the line.`;
  }
  if (rate >= 80) {
    return `${rate}% cleared. Execution is sharp — protect the streak and resist complacency.`;
  }
  if (laggard && laggard.pct < 0.5) {
    return `Your ${laggard.name} targets are lagging at ${Math.round(laggard.pct * 100)}%. Concentrate force there before starting anything new.`;
  }
  return `${completed} of ${total} done — ${rate}% overall. Steady, not spectacular. Close the open loops one at a time.`;
};

export const getProductivityInsight = async (tasks: Task[]): Promise<string> => {
  // Free default: no key means a locally-generated insight, no network call.
  if (!getApiKey()) return buildLocalInsight(tasks);

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

    return response.text || buildLocalInsight(tasks);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return buildLocalInsight(tasks);
  }
};
