import { createGenerateHighlightsPrompt } from './createGenerateHighlightsPrompt';
import { config } from 'dotenv';
config();

export async function generateHighlights(fullText: string): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  // Truncate text to fit within token limits (approximately 15,000 characters ≈ 4,000 tokens)
  // Groq free tier has 12,000 token limit, we need to leave room for prompt and response
  const maxChars = 15000;
  const truncatedText =
    fullText.length > maxChars
      ? fullText.substring(0, maxChars) + '...'
      : fullText;

  if (fullText.length > maxChars) {
    console.log(
      `   Note: Transcript truncated from ${fullText.length} to ${maxChars} characters to fit API limits`
    );
  }

  const prompt = createGenerateHighlightsPrompt(truncatedText);

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: 1000,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();

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
