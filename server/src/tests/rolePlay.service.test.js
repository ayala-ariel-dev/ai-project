import fs from 'fs';
import * as geminiService from '../services/gemini.service.js';
import * as rolePlayService from '../services/rolePlay.service.js';
import { v4 as uuidv4 } from 'uuid';

// Mock של המודולים החיצוניים
jest.mock('fs');
jest.mock('../services/gemini.service.js');
jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));

describe('RolePlay Service', () => {
  const fakeText = 'Once upon a story';
  const fakeAIResponse = { roles: { A: 'Alice', B: 'Bob' } };
  const fakeRolePlayText = 'Hello, Bob!';

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(false); // ברירת מחדל: קובץ לא קיים
  });

  // ----------------------
  // startRolePlaySession
  // ----------------------
  describe('startRolePlaySession', () => {
    it('should create a new session with opening message', async () => {
      fs.readFileSync.mockReturnValue('prompt content');
      geminiService.callGeminiAnalyzeText.mockResolvedValue(fakeAIResponse);
      geminiService.callGeminiRolePlay.mockResolvedValue(fakeRolePlayText);

      const session = await rolePlayService.startRolePlaySession(fakeText);

      expect(session.id).toBe('test-uuid');
      expect(session.roles).toEqual(fakeAIResponse.roles);
      expect(session.messages[0].text).toBe(fakeRolePlayText);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should store language and include it in the opening prompt', async () => {
      fs.readFileSync.mockReturnValue('prompt content');
      geminiService.callGeminiAnalyzeText.mockResolvedValue(fakeAIResponse);
      geminiService.callGeminiRolePlay.mockResolvedValue(fakeRolePlayText);

      const session = await rolePlayService.startRolePlaySession(fakeText, 'en');

      expect(session.language).toBe('en');
      expect(geminiService.callGeminiRolePlay.mock.calls[0][0]).toContain('Write in English');
    });

    it('should throw if callGeminiAnalyzeText fails', async () => {
      fs.readFileSync.mockReturnValue('prompt content');
      geminiService.callGeminiAnalyzeText.mockRejectedValue(new Error('API Error'));

      await expect(rolePlayService.startRolePlaySession(fakeText))
        .rejects.toThrow('API Error');
    });
  });

  // ----------------------
  // sendRolePlayReply
  // ----------------------
  describe('sendRolePlayReply', () => {
    const existingSession = {
      id: 'test-uuid',
      roles: { A: 'Alice', B: 'Bob' },
      messages: [{ role: 'A', text: 'Hello, Bob!' }],
      storyText: fakeText
    };

    beforeEach(() => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify([existingSession]));
    });

    it('should return AI reply and update session', async () => {
      geminiService.callGeminiRolePlay.mockResolvedValue('AI reply text');

      const reply = await rolePlayService.sendRolePlayReply('test-uuid', 'User message');

      expect(reply.text).toBe('AI reply text');
      expect(fs.writeFileSync).toHaveBeenCalled();

      // גם נשמרה ההודעה של המשתמש וה-AI
      const savedData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(savedData[0].messages.length).toBe(3);
      expect(savedData[0].messages[1]).toEqual({ role: 'B', text: 'User message' });
      expect(savedData[0].messages[2]).toEqual({ role: 'A', text: 'AI reply text' });
    });

    it('should throw error if session not found', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify([]));

      await expect(rolePlayService.sendRolePlayReply('wrong-id', 'Hi'))
        .rejects.toThrow('Session not found');
    });
  });

  // ----------------------
  // giveUserFeedback
  // ----------------------
  describe('giveUserFeedback', () => {
    const sessionWithMessages = {
      id: 'test-uuid',
      roles: { A: 'Alice', B: 'Bob' },
      messages: [
        { role: 'A', text: 'Hello, Bob!' },
        { role: 'B', text: 'Hi Alice!' }
      ]
    };

    beforeEach(() => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify([sessionWithMessages]));
    });

    it('should return parsed JSON feedback', async () => {
      const fakeFeedback = '```json{"understanding":"Good","comments":"Well done"} ```';
      geminiService.callGeminiRolePlay.mockResolvedValue(fakeFeedback);

      const feedback = await rolePlayService.giveUserFeedback('test-uuid');

      expect(feedback).toEqual({ understanding: 'Good', comments: 'Well done' });
    });

    it('should throw error if session not found', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify([]));

      await expect(rolePlayService.giveUserFeedback('wrong-id'))
        .rejects.toThrow('Session not found');
    });
  });
});
