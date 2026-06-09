import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { cacheService } from './cache.service.js';
import { truncateString } from '../utils/helpers.js';

/**
 * System prompt that defines CarbonWise AI assistant's behavior.
 * Engineered for accuracy, helpfulness, and actionable advice.
 * @type {string}
 */
const SYSTEM_PROMPT = `You are CarbonWise, a friendly and knowledgeable AI assistant specialized in carbon footprint awareness and environmental sustainability.

Your core responsibilities:
1. Help users understand their carbon footprint and its environmental impact
2. Provide science-based information about greenhouse gas emissions
3. Suggest practical, actionable steps to reduce carbon emissions
4. Calculate approximate carbon footprints for various daily activities
5. Motivate and encourage sustainable lifestyle changes

Guidelines for your responses:
- Be conversational, supportive, and encouraging — never preachy or judgmental
- Use specific numbers and data when possible (cite EPA, DEFRA, or IPCC sources)
- Provide context by comparing to national/global averages
- Suggest alternatives that are practical, affordable, and achievable
- Format responses with clear structure using markdown (headers, bullet points, bold)
- Keep responses concise but informative (150-300 words)
- When asked about calculations, show your work step-by-step
- If you don't know something, say so honestly rather than guessing
- Focus on positive impact — frame changes as opportunities, not sacrifices

Topic areas you cover:
- Transportation (driving, flying, public transit)
- Home energy (electricity, heating, cooling)
- Diet and food choices
- Shopping and consumption habits
- Waste and recycling
- Water usage
- Carbon offsets and credits
- Climate science basics`;

/** @type {GoogleGenerativeAI|null} */
let genAI = null;

/** @type {import('@google/generative-ai').GenerativeModel|null} */
let model = null;

/**
 * Initializes the Gemini AI client and model.
 * Called lazily on first request to avoid startup failures in tests.
 * @throws {Error} If the API key is not configured
 */
function initializeClient() {
  if (model) {
    return;
  }

  if (!config.geminiApiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  genAI = new GoogleGenerativeAI(config.geminiApiKey);
  model = genAI.getGenerativeModel({
    model: config.geminiModel,
    systemInstruction: SYSTEM_PROMPT,
  });

  logger.info('Gemini AI client initialized', { model: config.geminiModel });
}

/**
 * Generates a chat response from the Gemini AI model.
 * Includes caching for similar queries to reduce API calls and latency.
 * @param {string} userMessage - The user's input message
 * @param {Array<{role: string, parts: Array<{text: string}>}>} [conversationHistory=[]] - Previous conversation turns
 * @returns {Promise<{response: string, cached: boolean}>} The AI response and cache status
 * @throws {Error} If the Gemini API call fails
 */
export async function generateChatResponse(userMessage, conversationHistory = []) {
  initializeClient();

  // Check cache for similar queries (only for stateless queries without history)
  if (conversationHistory.length === 0) {
    const cachedResponse = await cacheService.get(userMessage);
    if (cachedResponse) {
      logger.debug('Returning cached chat response');
      return { response: cachedResponse, cached: true };
    }
  }

  try {
    const chat = model.startChat({
      history: conversationHistory,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();

    // Cache the response for future similar queries
    if (conversationHistory.length === 0) {
      await cacheService.set(userMessage, responseText);
    }

    logger.info('Gemini response generated', {
      messageLength: userMessage.length,
      responseLength: responseText.length,
    });

    return { response: responseText, cached: false };
  } catch (error) {
    logger.error('Gemini API error', {
      error: error.message,
      userMessage: truncateString(userMessage, 100),
    });
    throw new Error('Failed to generate AI response. Please try again later.');
  }
}

/**
 * Generates personalized eco tips based on the user's carbon footprint data.
 * Uses the AI model to analyze the user's highest-emission categories
 * and provide targeted recommendations.
 * @param {Object} footprintData - The user's calculated carbon footprint
 * @returns {Promise<{tips: string, cached: boolean}>} Personalized tips and cache status
 * @throws {Error} If the Gemini API call fails
 */
export async function generatePersonalizedTips(footprintData) {
  initializeClient();

  const prompt = `Based on this carbon footprint data, provide 5 specific, actionable tips to reduce emissions. Focus on the highest-impact areas first.

Carbon Footprint Data:
- Total annual emissions: ${footprintData.totalTonnes} tonnes CO₂e
- Transport: ${footprintData.breakdown?.transport?.kg || 0} kg CO₂e/year
- Energy: ${footprintData.breakdown?.energy?.kg || 0} kg CO₂e/year
- Diet: ${footprintData.breakdown?.diet?.kg || 0} kg CO₂e/year
- Shopping: ${footprintData.breakdown?.shopping?.kg || 0} kg CO₂e/year

For each tip, include:
1. The specific action to take
2. Estimated CO₂e savings per year
3. Difficulty level (Easy, Medium, Hard)
4. A brief explanation of why it helps

Format with markdown headers and bullet points for readability.`;

  const cacheKey = `tips_${footprintData.totalTonnes}`;
  const cachedTips = await cacheService.get(cacheKey);
  if (cachedTips) {
    return { tips: cachedTips, cached: true };
  }

  try {
    const result = await model.generateContent(prompt);
    const tipsText = result.response.text();

    await cacheService.set(cacheKey, tipsText);

    logger.info('Personalized tips generated', {
      totalTonnes: footprintData.totalTonnes,
    });

    return { tips: tipsText, cached: false };
  } catch (error) {
    logger.error('Gemini API error during tips generation', {
      error: error.message,
    });
    throw new Error('Failed to generate personalized tips. Please try again later.');
  }
}

/**
 * Resets the Gemini client. Used in testing to allow re-initialization.
 */
export function resetClient() {
  genAI = null;
  model = null;
}
