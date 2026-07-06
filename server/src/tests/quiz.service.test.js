import {
  generateQuiz,
  generateMultipleChoiceQuiz,
  generateTrueFalseQuiz
} from '../services/quiz.service.js';
import * as geminiService from '../services/gemini.service.js';

// Mock של callGeminiAnalyzeText
jest.mock('../services/gemini.service.js');

describe('Quiz Service', () => {
  const fakeText = 'Some study text';
  const fakeAIResponse = { questions: ['Q1', 'Q2'] };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateQuiz', () => {
    it('should call callGeminiAnalyzeText with base prompt and return result', async () => {
      geminiService.callGeminiAnalyzeText.mockResolvedValue(fakeAIResponse);

      const result = await generateQuiz(fakeText);

      // בדיקה שהפונקציה נקראה פעם אחת
      expect(geminiService.callGeminiAnalyzeText).toHaveBeenCalledTimes(1);

      // בדיקה שהקריאה כללה את הטקסט הנכון
      const calledPrompt = geminiService.callGeminiAnalyzeText.mock.calls[0][0];
      const calledText = geminiService.callGeminiAnalyzeText.mock.calls[0][1];
      expect(calledText).toBe(fakeText);

      // בדיקה שהפונקציה מחזירה את התוצאה הנכונה
      expect(result).toEqual(fakeAIResponse);
    });

    it('should throw error if callGeminiAnalyzeText rejects', async () => {
      geminiService.callGeminiAnalyzeText.mockRejectedValue(new Error('API Error'));

      await expect(generateQuiz(fakeText)).rejects.toThrow('API Error');
    });
  });

  describe('generateMultipleChoiceQuiz', () => {
    it('should call callGeminiAnalyzeText with multiple choice prompt and return result', async () => {
      geminiService.callGeminiAnalyzeText.mockResolvedValue(fakeAIResponse);

      const result = await generateMultipleChoiceQuiz(fakeText);

      expect(geminiService.callGeminiAnalyzeText).toHaveBeenCalledTimes(1);
      expect(result).toEqual(fakeAIResponse);
    });

    it('should include selected language in multiple choice prompt', async () => {
      geminiService.callGeminiAnalyzeText.mockResolvedValue(fakeAIResponse);

      await generateMultipleChoiceQuiz(fakeText, 'en');

      const calledPrompt = geminiService.callGeminiAnalyzeText.mock.calls[0][0];
      expect(calledPrompt).toContain('Target output language: English');
    });

    it('should return fallback quiz if callGeminiAnalyzeText rejects', async () => {
      geminiService.callGeminiAnalyzeText.mockRejectedValue(new Error('API Error'));

      const result = await generateMultipleChoiceQuiz(fakeText);
      expect(result.questions.length).toBeGreaterThan(0);
      expect(result.questions[0].type).toBe('multiple_choice');
    });
  });

  describe('generateTrueFalseQuiz', () => {
    it('should call callGeminiAnalyzeText with true/false prompt and return result', async () => {
      geminiService.callGeminiAnalyzeText.mockResolvedValue(fakeAIResponse);

      const result = await generateTrueFalseQuiz(fakeText);

      expect(geminiService.callGeminiAnalyzeText).toHaveBeenCalledTimes(1);
      expect(result).toEqual(fakeAIResponse);
    });

    it('should include selected language in true/false prompt', async () => {
      geminiService.callGeminiAnalyzeText.mockResolvedValue(fakeAIResponse);

      await generateTrueFalseQuiz(fakeText, 'he');

      const calledPrompt = geminiService.callGeminiAnalyzeText.mock.calls[0][0];
      expect(calledPrompt).toContain('Target output language: Hebrew');
    });

    it('should return fallback quiz if callGeminiAnalyzeText rejects', async () => {
      geminiService.callGeminiAnalyzeText.mockRejectedValue(new Error('API Error'));

      const result = await generateTrueFalseQuiz(fakeText);
      expect(result.questions.length).toBeGreaterThan(0);
      expect(result.questions[0].type).toBe('true_false');
    });
  });
});
