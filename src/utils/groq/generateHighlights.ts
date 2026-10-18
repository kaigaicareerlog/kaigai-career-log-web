import { chatCompletion } from './chatCompletion';
import { createGenerateHighlightsPrompt } from './createGenerateHighlightsPrompt';

// The Groq free tier allows 8,000 tokens per minute, counting the prompt and
// max_tokens. Japanese runs about 0.7 tokens per character, so 7,000
// characters leaves room for the prompt and a 2,000-token response.
const MAX_TRANSCRIPT_CHARS = 7000;

export async function generateHighlights(fullText: string): Promise<string[]> {
  const truncatedText =
    fullText.length > MAX_TRANSCRIPT_CHARS
      ? fullText.substring(0, MAX_TRANSCRIPT_CHARS) + '...'
      : fullText;

  if (fullText.length > MAX_TRANSCRIPT_CHARS) {
    console.log(
      `   Note: Transcript truncated from ${fullText.length} to ${MAX_TRANSCRIPT_CHARS} characters to fit API limits`
    );
  }

  const content = await chatCompletion({
    messages: [
      { role: 'user', content: createGenerateHighlightsPrompt(truncatedText) },
    ],
    temperature: 0.9,
    // The default model reasons before answering, which uses part of this
    maxTokens: 2000,
    reasoningEffort: 'low',
  });

  // Parse the response - split by newlines and filter out empty lines
  const highlights = content
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);

  if (highlights.length !== 3) {
    console.warn(
      `   Warning: Expected 3 highlights but got ${highlights.length}`
    );
  }

  return highlights.slice(0, 3); // Take only first 3
}
