import { config } from 'dotenv';
config();

export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Ask Groq to return a single valid JSON object */
  jsonMode?: boolean;
  /** Reasoning effort for reasoning models such as openai/gpt-oss-* */
  reasoningEffort?: 'low' | 'medium' | 'high';
  /** How many times to retry after a per-minute rate limit (default 4) */
  maxRetries?: number;
}

/**
 * Thrown when the daily token quota is used up. Retrying later the same day
 * won't help, so callers should stop and try again tomorrow.
 */
export class GroqDailyLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GroqDailyLimitError';
  }
}

/**
 * Reads how long to wait from Groq's 429 response (Retry-After header, or the
 * "try again in 7.5s" text in the body). Falls back to 10 seconds.
 */
function getRetryDelayMs(response: Response, body: string): number {
  const header = Number(response.headers.get('retry-after'));
  if (header > 0) return header * 1000;

  const match = body.match(/try again in ([\d.]+)(ms|s|m)\b/i);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 'ms') return value;
    if (unit === 'm') return value * 60_000;
    return value * 1000;
  }
  return 10_000;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calls the Groq chat completions API and returns the message text.
 * Waits and retries on per-minute rate limits; throws GroqDailyLimitError
 * when the daily quota is exhausted.
 */
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  const { maxRetries = 4 } = options;

  for (let attempt = 0; ; attempt++) {
    const response = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model ?? DEFAULT_GROQ_MODEL,
        messages: options.messages,
        temperature: options.temperature ?? 0,
        max_tokens: options.maxTokens ?? 1000,
        ...(options.jsonMode && { response_format: { type: 'json_object' } }),
        ...(options.reasoningEffort && {
          reasoning_effort: options.reasoningEffort,
        }),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content.trim();
    }

    const body = await response.text();

    if (response.status === 429) {
      if (/per day|\bTPD\b/i.test(body)) {
        throw new GroqDailyLimitError(body);
      }
      if (attempt < maxRetries) {
        await sleep(getRetryDelayMs(response, body) + 500);
        continue;
      }
    }

    throw new Error(`Groq API error: ${response.status} - ${body}`);
  }
}
