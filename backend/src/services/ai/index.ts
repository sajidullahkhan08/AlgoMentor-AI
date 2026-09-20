/**
 * AI Provider factory.
 *
 * Implements DEC-005 (Replaceable AI Provider) and DEC-006 (Free-First).
 * Automatically provides GeminiProvider if GEMINI_API_KEY is configured,
 * otherwise falls back seamlessly to MockAIProvider.
 */

import { AIProvider } from './aiProvider';
import { GeminiProvider } from './geminiProvider';
import { MockAIProvider } from './mockProvider';

let _provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (_provider) {
    return _provider;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key') {
    console.log('[AlgoMentor] Initializing Gemini AI Provider (model: gemini-2.5-flash)');
    _provider = new GeminiProvider(apiKey);
  } else {
    console.log('[AlgoMentor] GEMINI_API_KEY not set — using deterministic MockAIProvider fallback');
    _provider = new MockAIProvider();
  }

  return _provider;
}

export * from './aiProvider';
export * from './mockProvider';
export * from './geminiProvider';
