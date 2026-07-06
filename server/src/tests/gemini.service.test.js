import * as geminiService from '../services/gemini.service.js';

// Mock של הפונקציות עצמן
jest.mock('../services/gemini.service.js');

describe('Gemini Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('callGeminiAnalyzeText', () => {
    it('should return parsed JSON from Gemini response', async () => {
      const fakeResponse = { question: 'What is AI?' };
      geminiService.callGeminiAnalyzeText.mockResolvedValue(fakeResponse);

      const result = await geminiService.callGeminiAnalyzeText('Analyze this text', 'Some study text');

      expect(result).toEqual(fakeResponse);
      expect(geminiService.callGeminiAnalyzeText).toHaveBeenCalledTimes(1);
      expect(geminiService.callGeminiAnalyzeText).toHaveBeenCalledWith('Analyze this text', 'Some study text');
    });

    it('should throw an error if Gemini fails', async () => {
      geminiService.callGeminiAnalyzeText.mockRejectedValue(new Error('API Error'));

      await expect(
        geminiService.callGeminiAnalyzeText('prompt', 'text')
      ).rejects.toThrow('API Error');
    });
  });

  describe('callGeminiRolePlay', () => {
    it('should return text from Gemini response', async () => {
      const fakeResponse = 'Role play response';
      geminiService.callGeminiRolePlay.mockResolvedValue(fakeResponse);

      const result = await geminiService.callGeminiRolePlay('Start role play');

      expect(result).toBe(fakeResponse);
      expect(geminiService.callGeminiRolePlay).toHaveBeenCalledTimes(1);
      expect(geminiService.callGeminiRolePlay).toHaveBeenCalledWith('Start role play');
    });

    it('should throw an error if Gemini fails', async () => {
      geminiService.callGeminiRolePlay.mockRejectedValue(new Error('API Error'));

      await expect(
        geminiService.callGeminiRolePlay('prompt')
      ).rejects.toThrow('API Error');
    });
  });
});
