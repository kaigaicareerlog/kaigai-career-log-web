import {
  parseEpisodeMeta,
  type ParsedEpisodeMeta,
} from '../episodeMeta/parseEpisodeMeta';
import { chatCompletion, DEFAULT_GROQ_MODEL } from './chatCompletion';
import {
  createExtractEpisodeMetaPrompt,
  type EpisodeMetaPromptInput,
} from './createExtractEpisodeMetaPrompt';

/**
 * Extracts guest facts and controlled tags for one episode using Groq.
 * Temperature is 0 because this is extraction, not creative writing.
 * The result is a draft (`reviewed: false`) for a human to check.
 *
 * @throws GroqDailyLimitError when the daily quota is exhausted
 */
export async function extractEpisodeMeta(
  input: EpisodeMetaPromptInput,
  model: string = DEFAULT_GROQ_MODEL
): Promise<ParsedEpisodeMeta> {
  const content = await chatCompletion({
    messages: [
      { role: 'user', content: createExtractEpisodeMetaPrompt(input) },
    ],
    model,
    temperature: 0,
    // Reasoning models spend part of this budget on thinking before answering
    maxTokens: 2000,
    jsonMode: true,
    // Extraction is simple: keep reasoning short (only gpt-oss models accept it)
    reasoningEffort: model.startsWith('openai/gpt-oss') ? 'low' : undefined,
  });

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new Error(`Model returned invalid JSON: ${content.slice(0, 200)}`);
  }

  return parseEpisodeMeta(raw);
}
