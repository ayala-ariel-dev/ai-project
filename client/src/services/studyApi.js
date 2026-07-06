import axios from "axios";
import { clearAuthStorage, getAccessToken, getCurrentUser } from "./authStorage";

// אינסטנס אחד לכל ה־API, אפשר להפריד אם רוצים
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api",
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthStorage();
    }

    return Promise.reject(error);
  }
);

const getPromptUserContext = () => {
  const user = getCurrentUser();
  if (!user) return null;

  return {
    name: user.name || "",
    givenName: user.givenName || "",
    familyName: user.familyName || "",
    locale: user.locale || "",
  };
};

// פונקציה גנרית לשליחת בקשות למבחנים
export const analyzeQuiz = async (text, type = "multiple-choice", language = "he") => {
  if (!text?.trim()) return null;

  const endpoints = {
    "multiple-choice": "study/quiz/multiple-choice",
    "true-false": "study/quiz/true-false",
  };

  const endpoint = endpoints[type];
  if (!endpoint) throw new Error(`Unknown quiz type: ${type}`);

  try {
    const { data } = await api.post(endpoint, { text, language, userContext: getPromptUserContext() });
    console.log(`API response (${type}):`, data);
    return data;
  } catch (err) {
    console.error(`Error calling analyzeQuiz (${type}):`, err);
    throw err; // מעבירים הלאה כדי לטפל בקומפוננטה
  }
};

// התחלת משחק תפקידים חדש
export const startRolePlay = async (text, language = "he") => {
  if (!text?.trim()) return null;

  try {
    const { data } = await api.post("role-play", { text, language, userContext: getPromptUserContext() });
    return data;
  } catch (err) {
    console.error("Error starting role play:", err);
    throw err;
  }
};

// שליחת הודעה במשחק תפקידים
export const sendRolePlayMessage = async (sessionId, message) => {
  if (!sessionId || !message?.trim()) return null;

  try {
    const { data } = await api.post("role-play/message", { sessionId, message });
    return data;
  } catch (err) {
    console.error("Error sending role play message:", err);
    throw err;
  }
};

export const getRolePlayFeedback = async (sessionId) => {
  if (!sessionId) return null;
  try {
    const { data } = await api.post("role-play/feedback", { sessionId });
    return data;
  } catch (err) {
    console.error("Error fetching role play feedback:", err);
    throw err;
  }
};
