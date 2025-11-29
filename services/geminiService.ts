import { GoogleGenAI } from "@google/genai";
import { Task, TaskFrequency } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getProductivityInsight = async (tasks: Task[]): Promise<string> => {
  try {
    const completedCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;
    
    // Group by frequency for context
    const daily = tasks.filter(t => t.frequency === TaskFrequency.DAILY);
    const weekly = tasks.filter(t => t.frequency === TaskFrequency.WEEKLY);
    
    const summary = `
      Total Tasks: ${totalCount}
      Completed: ${completedCount}
      Daily Tasks: ${daily.length} (${daily.filter(t => t.completed).length} done)
      Weekly Tasks: ${weekly.length} (${weekly.filter(t => t.completed).length} done)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are a minimalist, stoic productivity coach.
        Analyze this user's task data:
        ${summary}

        Provide a very brief, high-impact insight or observation about their progress. 
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