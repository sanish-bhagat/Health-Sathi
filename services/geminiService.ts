
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { MASTER_SYSTEM_PROMPT } from "../constants";
import { AIGuidance } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize client
const ai = new GoogleGenAI({ apiKey });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    english_guidance: { type: Type.STRING },
    local_language_guidance: { type: Type.STRING },
    detected_language: { type: Type.STRING },
    medications: { type: Type.ARRAY, items: { type: Type.STRING } },
    medication_details: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          dosage: { type: Type.STRING },
          frequency: { type: Type.STRING },
          timing: { type: Type.STRING },
          instructions: { type: Type.STRING }
        },
        required: ["name", "dosage", "frequency", "timing", "instructions"]
      }
    },
    is_critical: { type: Type.BOOLEAN },
    critical_reason: { type: Type.STRING, nullable: true },
    confidence_score: { type: Type.NUMBER, description: "Confidence score between 0 and 100" },
    extracted_values: { 
      type: Type.ARRAY, 
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING },
          value: { type: Type.STRING }
        },
        required: ["key", "value"]
      },
      description: "Key value pairs of extracted medical data"
    },
    comparison_summary: { type: Type.STRING, description: "Summary of changes vs previous history", nullable: true }
  },
  required: ["english_guidance", "local_language_guidance", "detected_language", "medications", "medication_details", "is_critical", "confidence_score", "extracted_values"]
};

export const analyzeMedicalInputs = async (
  imageBase64: string | null,
  pdfBase64: string | null,
  audioBase64: string | null,
  previousHistory: string | null = null,
  textInput: string | null = null
): Promise<AIGuidance> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const parts: any[] = [];

  if (imageBase64) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });
  }

  if (pdfBase64) {
    parts.push({ inlineData: { mimeType: "application/pdf", data: pdfBase64 } });
  }

  if (audioBase64) {
    parts.push({ inlineData: { mimeType: "audio/wav", data: audioBase64 } });
  }

  let promptText = "Analyze these medical inputs and provide guidance. Pay special attention to identifying medications and their dosage schedules from any provided prescriptions.";
  
  if (textInput) {
    promptText += `\n\nPATIENT REPORTED SYMPTOMS/NOTES:\n${textInput}`;
  }

  if (previousHistory) {
    promptText += `\n\nCONTEXT - PREVIOUS HISTORY:\n${previousHistory}`;
  }

  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: MASTER_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const parsed = JSON.parse(text);
    
    if (Array.isArray(parsed.extracted_values)) {
      const valuesMap: Record<string, string> = {};
      parsed.extracted_values.forEach((item: any) => {
        if (item.key && item.value) {
          valuesMap[item.key] = item.value;
        }
      });
      parsed.extracted_values = valuesMap;
    }

    return parsed as AIGuidance;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following medical guidance into ${targetLanguage}. Return ONLY the translated text.\n\nGuidance: ${text}`,
      config: {
        temperature: 0,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini Translation Error:", error);
    return text;
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        }
      }
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("No audio generated by Gemini");
    return audioData;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};
