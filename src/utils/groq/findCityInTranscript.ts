import { resolveTag } from '../episodeMeta/resolveTag';
import { chatCompletion, DEFAULT_GROQ_MODEL } from './chatCompletion';
import {
  createFindCityInTranscriptPrompt,
  type FindCityInTranscriptInput,
} from './createFindCityInTranscriptPrompt';

export interface CityFinding {
  /** A known city slug, when the model found one on the fixed list */
  citySlug: string | null;
  /** Free text, when the model found a city that isn't in the vocabulary yet */
  otherCity: string | null;
  /** Quote/paraphrase backing the finding, for a human to sanity-check */
  evidence: string | null;
}

/**
 * Asks Groq to find an explicit city mention in a transcript. Returns nulls
 * (not a thrown error) whenever the response is unusable, since this is a
 * best-effort backfill over many episodes.
 * @throws GroqDailyLimitError when the daily quota is exhausted
 */
export async function findCityInTranscript(
  input: FindCityInTranscriptInput,
  model: string = DEFAULT_GROQ_MODEL
): Promise<CityFinding> {
  const content = await chatCompletion({
    messages: [
      { role: 'user', content: createFindCityInTranscriptPrompt(input) },
    ],
    model,
    temperature: 0,
    maxTokens: 800,
    jsonMode: true,
    reasoningEffort: model.startsWith('openai/gpt-oss') ? 'low' : undefined,
  });

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    return { citySlug: null, otherCity: null, evidence: null };
  }

  const data = (raw ?? {}) as Record<string, unknown>;
  const cityRaw = typeof data.city === 'string' ? data.city : null;
  const tag = cityRaw ? resolveTag('city', cityRaw) : null;

  return {
    citySlug: tag?.slug ?? null,
    otherCity:
      !tag && typeof data.otherCity === 'string' ? data.otherCity : null,
    evidence: typeof data.evidence === 'string' ? data.evidence : null,
  };
}
