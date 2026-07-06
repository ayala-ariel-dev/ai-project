import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { callGeminiRolePlay, callGeminiAnalyzeText } from './gemini.service.js';
import { v4 as uuidv4 } from 'uuid';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const storagePath = path.join(__dirname, "..", "rolePlaySessions.json");

const storagePath = path.join(process.cwd(), 'src', 'rolePlaySessions.json');

const normalizeLanguage = (language) => (language === 'en' ? 'en' : 'he');

const getLanguageName = (language) => (
  normalizeLanguage(language) === 'en' ? 'English' : 'Hebrew'
);

const sanitizeUserContext = (userContext = {}) => {
  const source = userContext || {};
  const trim = (value) => String(value || '').trim().slice(0, 80);

  return {
    name: trim(source.name),
    givenName: trim(source.givenName),
    familyName: trim(source.familyName),
    locale: trim(source.locale),
  };
};

const getUserInstruction = (userContext) => {
  const safeUser = sanitizeUserContext(userContext);
  const displayName = safeUser.givenName || safeUser.name;
  if (!displayName && !safeUser.locale) return '';

  return `
Learner context:
- Display name: ${displayName || 'not provided'}
- Locale: ${safeUser.locale || 'not provided'}
Use the learner's display name only when it feels natural and friendly. Do not mention email, account data, or private details.
`;
};

const withLanguageInstruction = (prompt, language, userContext) => `
${prompt}

Target output language: ${getLanguageName(language)}.
Important: Generate every user-facing value in ${getLanguageName(language)}, regardless of the source text language.
Keep JSON keys exactly as specified when JSON is requested.
${getUserInstruction(userContext)}
`;

// --- Save & Load Sessions ---
function saveSession(session) {
  let sessions = [];
  if (fs.existsSync(storagePath)) {
    sessions = JSON.parse(fs.readFileSync(storagePath, "utf8"));
  }
  const index = sessions.findIndex(s => s.id === session.id);
  if (index > -1) sessions[index] = session;
  else sessions.push(session);
  fs.writeFileSync(storagePath, JSON.stringify(sessions, null, 2));
}

function loadSession(sessionId) {
  if (!fs.existsSync(storagePath)) return null;
  const sessions = JSON.parse(fs.readFileSync(storagePath, "utf8"));
  return sessions.find(s => s.id === sessionId) || null;
}

// --- Start Role Play ---
export async function startRolePlaySession(text, language = 'he', userContext = null) {
  const normalizedLanguage = normalizeLanguage(language);
  const safeUserContext = sanitizeUserContext(userContext);
  // const promptPath = path.join(__dirname, "..", "prompts", "rolePlayPrompt.txt");
  const promptPath = path.join(process.cwd(), "src", "prompts", "rolePlayPrompt.txt");
  const promptTemplate = withLanguageInstruction(fs.readFileSync(promptPath, "utf8"), normalizedLanguage, safeUserContext);

  const aiResponse = await callGeminiAnalyzeText(promptTemplate, text);

  const openingPrompt = `
You are role A in an educational role-play activity based on study material.
Create a single opening message to start the conversation with role B.
Rules:
1. Address role B directly using their name: ${aiResponse.roles.B}.
2. Introduce the learning situation naturally and set the tone for guided practice.
3. Write in ${getLanguageName(normalizedLanguage)}.
4. Do not include "Role A" or "Role B" in the message.
5. Keep it concise, engaging, and relevant to the study material.
6. If a learner display name is provided, you may greet them by that name once.
7. Start by asking one focused question that helps the learner explain the first central idea.
8. Do not summarize the entire text in the opening. Build the material step by step.

${getUserInstruction(safeUserContext)}

Study material:
<<<
${text}
>>>
`;

  const openingText = await callGeminiRolePlay(openingPrompt);

  const openingMessage = {
    role: "A",
    text: openingText
  };

  const session = {
    id: uuidv4(),
    roles: aiResponse.roles, // { A: "Alice", B: "Bob" }
    messages: [openingMessage], // מתחילים כבר עם הודעה דינמית
    storyText: text,
    language: normalizedLanguage,
    userContext: safeUserContext
  };

  saveSession(session);
  return session;
}

export async function sendRolePlayReply(sessionId, userMessage) {
  const session = loadSession(sessionId);
  if (!session) throw new Error("Session not found");

  // ודא שיש סיפור שמור בסשן
  if (!session.storyText) throw new Error("Story text not found in session");

  // כל השיחה הקודמת
  const conversationSoFar = session.messages.map(m => `${m.role}: ${m.text}`).join("\n");

  // Prompt חזק לכל סבב
  const language = normalizeLanguage(session.language);
  const userInstruction = getUserInstruction(session.userContext);
  const prompt = `
You are role A in an educational role-play activity based on study material.
Rules you MUST follow:
1. Always respond strictly as role A.
2. You are speaking directly to role B (the user).
3. Speak only about the study material provided.
4. Always respond in ${getLanguageName(language)} (do not switch languages).
5. Never discuss unrelated topics.
6. Always address the last message from role B naturally.
7. If the user writes in another language, still respond politely in ${getLanguageName(language)}.
8. If the user says something unrelated, gently bring them back to the material.
9. Teach through guided construction of understanding:
   - If the user is correct, briefly confirm and add the next connection or consequence.
   - If the user is partly correct, identify what is right and ask a focused follow-up.
   - If the user is wrong, correct gently using the study material and ask a simpler guiding question.
   - Prefer one clear learning move per reply.
10. Do not simply give long summaries. Use short explanations plus one question that advances understanding.
11. Build the material in a logical order: core idea, key terms, relationships, cause/effect, examples, then implications.
12. Use examples only when they are present in or directly supported by the study material.

${userInstruction}

Study material:
<<<
${session.storyText}
>>>

Conversation so far:
${conversationSoFar}
User (role B) says: ${userMessage}

Respond as role A only. Keep the reply educational, concise, relevant to the material, and end with one focused guiding question unless the user explicitly asks for something else.
`;

  const aiReplyText = await callGeminiRolePlay(prompt);

  // שמירה של ההודעות בסשן
  session.messages.push({ role: "B", text: userMessage });
  session.messages.push({ role: "A", text: aiReplyText });
  saveSession(session);

  return { role: "A", text: aiReplyText };
}


// --- Give Feedback on User Understanding ---
export async function giveUserFeedback(sessionId) {
  const session = loadSession(sessionId);
  if (!session) throw new Error("Session not found");

  const conversationText = session.messages.map(m => `${m.role}: ${m.text}`).join("\n");
  const language = normalizeLanguage(session.language);
  const userInstruction = getUserInstruction(session.userContext);

  const feedbackPrompt = `
You are an educational AI. Analyze the conversation between two roles, A and B.
Role A is the AI; Role B is the user. 

Generate feedback for the user (Role B) in ${getLanguageName(language)}.
In the feedback:
- Never include "Role A" or "Role B".
- Replace all mentions of Role A with "I".
- Replace all mentions of Role B with "You".
- Focus on the user's understanding of the study material, not on role-play performance.
- Mention one strength and one concrete next step for studying the material.
- Return a JSON object with the following structure:
{
  "understanding": "<language-appropriate value In one word: 'Good', 'Average', 'Poor', 'High', 'Low' or their equivalents>",
  "comments": "A few sentences giving clear feedback about how well the user understood the study material. Use 'I' for Role A and 'You' for Role B throughout."
}

${userInstruction}

Conversation:
${conversationText}
`;


  const feedbackRaw = await callGeminiRolePlay(feedbackPrompt);
  const feedbackCleaned = feedbackRaw.replace(/```json/gi, '').replace(/```/g, '').trim();

  return JSON.parse(feedbackCleaned);
}
