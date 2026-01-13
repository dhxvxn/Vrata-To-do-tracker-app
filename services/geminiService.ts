
import { GoogleGenAI } from "@google/genai";
import { Task, TaskFrequency } from "../types";

export const getProductivityInsight = async (tasks: Task[]): Promise<string> => {
  try {
    // Create a new instance right before making an API call to ensure it uses the most up-to-date API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const completedCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;
    
    // Group by frequency for context
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

    // Using gemini-3-flash-preview for basic text tasks as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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

    // The GenerateContentResponse object features a text property (not a method)
    return response.text || "Focus on the essential. Completion is the only metric.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to analyze patterns at this moment. Keep moving forward.";
  }
};
