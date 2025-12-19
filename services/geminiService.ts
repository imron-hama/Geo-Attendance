import { GoogleGenAI } from "@google/genai";
import { AttendanceRecord, AttendanceType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateWorkSummary = async (records: AttendanceRecord[]): Promise<string> => {
  try {
    // Filter for only today or recent records to keep prompt small
    const relevantRecords = records.slice(0, 20).map(r => ({
      type: r.type,
      time: new Date(r.timestamp).toLocaleString(),
      location: r.location ? `${r.location.latitude}, ${r.location.longitude}` : 'Unknown',
      note: r.note || 'No note'
    }));

    const prompt = `
      Analyze these time attendance records:
      ${JSON.stringify(relevantRecords)}

      Please provide a brief, professional summary (max 100 words) for the user.
      1. Calculate estimated total hours worked based on the pairs of check-in/check-out.
      2. If there are missing pairs (e.g. checked in but not out), mention it.
      3. Summarize any notes provided by the user.
      4. Add a short motivational quote at the end.
      Return plain text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate AI summary at this time.";
  }
};