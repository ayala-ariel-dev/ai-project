import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({ apiKey })
  : null;
const jsonRetryAttempts = 2;

const assertGeminiConfigured = () => {
  if (!ai) {
    throw new Error("Missing GEMINI_API_KEY in server/.env");
  }
};

/**
 * Analyze text + generate questions in SAME language
 */
export async function callGeminiAnalyzeText(prompt, text) {
  assertGeminiConfigured();

  let lastError;

  for (let attempt = 1; attempt <= jsonRetryAttempts; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: "models/gemini-2.5-flash",
        contents: [
          { text: prompt },
          { text: "Study text:\n" + text },
          { text: "Return ONLY valid JSON. Do not add markdown fences." }
        ]
      });

      const raw = response.text || '';
      const parsed = tryParseJson(raw);
      if (parsed) return parsed;

      throw new Error('Gemini returned non-JSON content');
    } catch (err) {
      lastError = err;
      if (attempt < jsonRetryAttempts) {
        continue;
      }
    }
  }

  console.error("Gemini error:", lastError);
  throw new Error(lastError?.message || "Failed to analyze text with Gemini");
}

function tryParseJson(raw) {
  const withoutFences = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(withoutFences);
  } catch {
    // Keep parsing fallback below.
  }

  const start = withoutFences.indexOf('{');
  const end = withoutFences.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  const maybeJson = withoutFences.slice(start, end + 1);
  try {
    return JSON.parse(maybeJson);
  } catch {
    return null;
  }
}

export async function callGeminiRolePlay(prompt) {
  try {
    assertGeminiConfigured();

    const response = await ai.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: [{ text: prompt }]
    });

    return response.text;
  } catch (err) {
    console.error("Gemini role play error:", err);
    throw new Error(err?.message || "Failed to generate role play response");
  }
}

