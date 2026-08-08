
import { GoogleGenAI } from "@google/genai";
import { Task, TaskFrequency, Quote } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getProductivityInsight = async (tasks: Task[]): Promise<string> => {
  try {
    const completedCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;
    
    const summary = `Tasks: ${completedCount}/${totalCount}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Stoic analyst. Brief insight on: ${summary}. Under 20 words. Minimalist.`,
    });

    return response.text || "Focus on the essential.";
  } catch (error) {
    return "Keep moving forward.";
  }
};

export const getDailyQuote = async (category: 'GENERAL' | 'EXAM' | 'FITNESS'): Promise<Quote> => {
  try {
    const today = new Date().toDateString();
    let focus = "";
    
    if (category === 'EXAM') {
      focus = "learning, intelligence, focus, or socratic wisdom";
    } else if (category === 'FITNESS') {
      focus = "physical strength, the body, endurance, or the will to push boundaries";
    } else {
      focus = "discipline, time management, stoicism, or the value of action";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a famous philosopher quote about ${focus}. 
      Format strictly as JSON: { "text": "quote text here", "author": "Philosopher Name" }. 
      Context: Today is ${today}. Make it unique and motivating for a minimalist dark theme.`,
      config: { responseMimeType: "application/json" }
    });
    
    const text = response.text || '{"text": "Waste no more time arguing what a good man should be. Be one.", "author": "Marcus Aurelius"}';
    const data = JSON.parse(text);
    return data;
  } catch (e) {
    return { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius" };
  }
};

export const generateWrappedReport = async (tasks: Task[], period: 'MONTH' | 'YEAR'): Promise<string> => {
  try {
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const fitness = tasks.filter(t => t.frequency === TaskFrequency.FITNESS && t.completed).length;
    
    const prompt = `Analyze this ${period} for a Vrata user:
    Total Tasks: ${total}, Completed: ${completed}, Fitness sessions: ${fitness}.
    Write a "Wrapped" style summary. Be poetic, slightly dark, and highly motivating. 
    Call out their best category. Keep it under 60 words. No emojis.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "A cycle concludes. The data shows growth through discipline.";
  } catch (e) {
    return "Your progress is etched in the record. A month of focus, a year of resolve.";
  }
};
