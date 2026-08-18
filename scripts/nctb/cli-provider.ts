import { createOpenAiCompatibleProvider } from '../../src/nctb/generation/provider.ts';

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable ${name}.`);
  return value;
}

export function generationProviderFromEnvironment() {
  return createOpenAiCompatibleProvider({
    id: 'nctb-generation-cli',
    baseUrl: requiredEnvironment('NCTB_AI_BASE_URL'),
    apiKey: requiredEnvironment('NCTB_AI_API_KEY'),
    model: requiredEnvironment('NCTB_AI_MODEL'),
  });
}

export function reviewProviderFromEnvironment() {
  return createOpenAiCompatibleProvider({
    id: 'nctb-independent-review-cli',
    baseUrl: requiredEnvironment('NCTB_REVIEW_BASE_URL'),
    apiKey: requiredEnvironment('NCTB_REVIEW_API_KEY'),
    model: requiredEnvironment('NCTB_REVIEW_MODEL'),
  });
}
