/**
 * Unit tests for GeminiService.
 * Tests AI integration with mocked API calls.
 */

import { jest } from '@jest/globals';

// Mock the GoogleGenerativeAI module before importing the service
jest.unstable_mockModule('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      startChat: jest.fn().mockReturnValue({
        sendMessage: jest.fn().mockResolvedValue({
          response: { text: () => 'Mocked AI response about carbon footprint' },
        }),
      }),
      generateContent: jest.fn().mockResolvedValue({
        response: { text: () => 'Mocked personalized tips' },
      }),
    }),
  })),
}));

// Set the API key before importing the service
process.env.GEMINI_API_KEY = 'test-api-key-for-testing';

const { generateChatResponse, generatePersonalizedTips, resetClient } = await import(
  '../../server/services/gemini.service.js'
);

describe('GeminiService', () => {
  beforeEach(() => {
    resetClient();
  });

  describe('generateChatResponse', () => {
    it('should return a response for a valid message', async () => {
      const result = await generateChatResponse('What is a carbon footprint?');
      expect(result).toBeDefined();
      expect(result.response).toBe('Mocked AI response about carbon footprint');
      expect(typeof result.cached).toBe('boolean');
    });

    it('should cache responses for identical queries', async () => {
      const result1 = await generateChatResponse('How to reduce emissions?');
      const result2 = await generateChatResponse('How to reduce emissions?');
      expect(result2.cached).toBe(true);
      expect(result2.response).toBe(result1.response);
    });

    it('should not cache when conversation history is provided', async () => {
      const history = [
        { role: 'user', parts: [{ text: 'Hi' }] },
        { role: 'model', parts: [{ text: 'Hello!' }] },
      ];
      const result = await generateChatResponse('Follow up question', history);
      expect(result).toBeDefined();
      expect(result.cached).toBe(false);
    });
  });

  describe('generatePersonalizedTips', () => {
    it('should generate tips for valid footprint data', async () => {
      const footprintData = {
        totalTonnes: 8.5,
        breakdown: {
          transport: { kg: 3000 },
          energy: { kg: 2000 },
          diet: { kg: 2500 },
          shopping: { kg: 1000 },
        },
      };
      const result = await generatePersonalizedTips(footprintData);
      expect(result.tips).toBe('Mocked personalized tips');
    });
  });
});
