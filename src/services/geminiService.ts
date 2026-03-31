import { GoogleGenAI, Type } from '@google/genai';
import { Activity, PREDEFINED_ACTIVITY_CATEGORIES } from '../constants/activities';

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const allActivities = PREDEFINED_ACTIVITY_CATEGORIES.flatMap(c => c.activities);

export async function generateTimelineFromPrompt(prompt: string, totalMinutes: number): Promise<string[]> {
  if (!ai) {
    throw new Error('Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable.');
  }

  const systemInstruction = `
You are a professional wedding planner. Your task is to generate a wedding timeline based on a user's prompt.

You will be given a prompt describing the desired wedding style and a total duration in minutes.
You must select a sequence of activities from the provided list that fits the prompt and the total duration.

The total duration of the selected activities should be as close as possible to the total event duration, but not exceeding it.

Here is the list of available activities with their IDs, names, and durations in minutes:
${allActivities.map(a => `- ID: ${a.id}, Name: ${a.name}, Duration: ${a.duration} min`).join('\n')}

Respond with only a JSON object containing a single key "activityIds", which is an array of the selected activity IDs in the correct order for the timeline.
Do not include any other text, explanation, or formatting.
`;

  const fullPrompt = `User Prompt: "${prompt}"\nTotal Duration: ${totalMinutes} minutes`;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            activityIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        },
        systemInstruction: systemInstruction
      }
    });

    const responseText = result.text;
    if (!responseText) {
        throw new Error('Empty response from AI.');
    }
    const parsed = JSON.parse(responseText);
    
    if (parsed.activityIds && Array.isArray(parsed.activityIds)) {
      return parsed.activityIds;
    } else {
      throw new Error('Invalid response format from AI.');
    }
  } catch (error) {
    console.error('Error generating timeline from prompt:', error);
    throw new Error('Failed to generate AI-powered timeline. Please try again.');
  }
}
