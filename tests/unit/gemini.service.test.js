/**
 * Unit tests for GeminiService.
 * Tests AI integration with mocked API calls.
 */

import { jest } from '@jest/globals';

// Global state to trigger errors in mock
global.mockGeminiError = false;

// Mock the GoogleGenerativeAI module before importing the service
jest.unstable_mockModule('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      startChat: jest.fn().mockReturnValue({
        sendMessage: jest.fn().mockImplementation(async () => {
          if (global.mockGeminiError) {throw new Error('API 500 Error');}
          return { response: { text: () => 'Mocked AI response about carbon footprint' } };
        }),
      }),
      generateContent: jest.fn().mockImplementation(async () => {
        if (global.mockGeminiError) {throw new Error('API 500 Error');}
        return { response: { text: () => 'Mocked personalized tips' } };
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

    it('should throw an error if the Gemini API fails', async () => {
      global.mockGeminiError = true;
      await expect(generateChatResponse('Will this fail?')).rejects.toThrow('Failed to generate AI response. Please try again later.');
      global.mockGeminiError = false;
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

    it('should throw an error if the Gemini API fails during tips generation', async () => {
      const footprintData = { totalTonnes: 10 };
      global.mockGeminiError = true;
      await expect(generatePersonalizedTips(footprintData)).rejects.toThrow('Failed to generate personalized tips. Please try again later.');
      global.mockGeminiError = false;
    });
  });
});
