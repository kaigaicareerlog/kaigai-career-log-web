import type { SpeakerGuess } from '../transcript/resolveSpeakerMap';
import { chatCompletion, DEFAULT_GROQ_MODEL } from './chatCompletion';
import {
  createIdentifySpeakersPrompt,
  type IdentifySpeakersPromptInput,
} from './createIdentifySpeakersPrompt';

/**
 * Ask the model which person each speaker label is
 * @throws GroqDailyLimitError when the daily quota is exhausted
 */
export async function identifySpeakers(
  input: IdentifySpeakersPromptInput,
  model: string = DEFAULT_GROQ_MODEL
): Promise<SpeakerGuess[]> {
  const request = () =>
    chatCompletion({
      messages: [
        { role: 'user', content: createIdentifySpeakersPrompt(input) },
      ],
      model,
      temperature: 0,
      // Reasoning models spend part of this budget on thinking before answering
      maxTokens: 1500,
      jsonMode: true,
      reasoningEffort: model.startsWith('openai/gpt-oss')
        ? 'medium'
        : undefined,
    });

  // JSON mode occasionally fails validation; one retry is usually enough
  const content = await request().catch((error: Error) => {
    if (!error.message.includes('json_validate_failed')) throw error;
    return request();
  });

  const parsed = JSON.parse(content) as { speakers?: SpeakerGuess[] };
  return Array.isArray(parsed.speakers) ? parsed.speakers : [];
}
