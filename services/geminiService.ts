import { GoogleGenAI, Type } from "@google/genai";
import { VocabCard } from '../types';
import { createNewCard } from './srsService';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// Check if user's English definition matches the card
export const checkMeaning = async (
  hanzi: string,
  correctDefinition: string,
  userAnswer: string
): Promise<{ isCorrect: boolean; feedback: string }> => {
  const ai = getClient();
  
  const prompt = `
    The Chinese word is "${hanzi}".
    The correct definition is: "${correctDefinition}".
    The user answered: "${userAnswer}".
    
    Task: determine if the user understands the meaning of the word.
    1. If the user's answer is a valid synonym or demonstrates understanding, mark as correct.
    2. If the user's answer is wrong or completely unrelated, mark as incorrect.
    
    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING, description: "Brief explanation (max 1 sentence) why it is correct or incorrect." }
          },
          required: ['isCorrect', 'feedback']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      isCorrect: result.isCorrect ?? false,
      feedback: result.feedback || (result.isCorrect ? "Correct!" : "Incorrect.")
    };
  } catch (error) {
    console.error("Gemini Check Error:", error);
    // Fallback if API fails: simple string include check to not block user
    const simpleCheck = correctDefinition.toLowerCase().includes(userAnswer.toLowerCase());
    return {
      isCorrect: simpleCheck,
      feedback: "AI verification failed. Falling back to simple text match."
    };
  }
};

export const generateVocabBatch = async (
  excludeList: string[],
  count: number = 5
): Promise<VocabCard[]> => {
  const ai = getClient();
  
  const excludeStr = excludeList.slice(-50).join(", "); 
  
  const prompt = `
    Generate ${count} distinct HSK Level 6 Chinese vocabulary words.
    Do NOT include these words: [${excludeStr}].
    
    For each word, provide:
    1. The Hanzi (Simplified)
    2. Pinyin
    3. English definition
    4. A natural, native-level example sentence using the word (HSK 6 level complexity)
    5. English translation of the sentence.

    Strictly follow the JSON schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              hanzi: { type: Type.STRING },
              pinyin: { type: Type.STRING },
              definition: { type: Type.STRING },
              exampleSentence: { type: Type.STRING },
              exampleTranslation: { type: Type.STRING }
            },
            required: ['hanzi', 'pinyin', 'definition', 'exampleSentence', 'exampleTranslation']
          }
        }
      }
    });

    const rawData = JSON.parse(response.text || '[]');
    
    return rawData.map((item: any) => 
      createNewCard(
        item.hanzi,
        item.pinyin,
        item.definition,
        item.exampleSentence,
        item.exampleTranslation
      )
    );
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};