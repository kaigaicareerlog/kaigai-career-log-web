import fs from 'fs';
import path from 'path';

/**
 * Spending guard for ElevenLabs Scribe. Every transcription is recorded in
 * src/data/transcriptionUsage.json by month, and a call that would push the
 * month over the cap is refused before any audio is sent.
 *
 * This is a second line of defence: also set a credit limit on the API key
 * in the ElevenLabs dashboard.
 */

/** Usage per month, keyed by "YYYY-MM" (UTC) */
export type TranscriptionUsage = Record<
  string,
  { audioSeconds: number; estimatedUsd: number; episodes: string[] }
>;

/**
 * Scribe v2 batch list price. ElevenLabs shows $0.22/hour, but some sources
 * list $0.27, so the higher figure is used to stay on the safe side.
 */
export const DEFAULT_USD_PER_HOUR = 0.27;
/** Keyterms add a 20% surcharge on the base price */
export const KEYTERM_SURCHARGE = 0.2;
export const DEFAULT_MONTHLY_BUDGET_USD = 5;
/** Longer audio is almost certainly the wrong file */
export const MAX_AUDIO_SECONDS = 2 * 60 * 60;

const USAGE_PATH = path.join(
  process.cwd(),
  'src',
  'data',
  'transcriptionUsage.json'
);

export function readUsage(): TranscriptionUsage {
  return fs.existsSync(USAGE_PATH)
    ? (JSON.parse(fs.readFileSync(USAGE_PATH, 'utf-8')) as TranscriptionUsage)
    : {};
}

export function writeUsage(usage: TranscriptionUsage): void {
  fs.writeFileSync(USAGE_PATH, JSON.stringify(usage, null, 2) + '\n', 'utf-8');
}

export function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

export function estimateCostUsd(
  audioSeconds: number,
  {
    withKeyterms,
    usdPerHour = DEFAULT_USD_PER_HOUR,
  }: {
    withKeyterms: boolean;
    usdPerHour?: number;
  }
): number {
  const rate = usdPerHour * (withKeyterms ? 1 + KEYTERM_SURCHARGE : 1);
  return (audioSeconds / 3600) * rate;
}

/**
 * Throws if the audio is suspiciously long or the estimated cost would take
 * this month's spending over the budget.
 */
export function assertWithinBudget({
  usage,
  month,
  audioSeconds,
  estimatedUsd,
  monthlyBudgetUsd,
}: {
  usage: TranscriptionUsage;
  month: string;
  audioSeconds: number;
  estimatedUsd: number;
  monthlyBudgetUsd: number;
}): void {
  if (audioSeconds > MAX_AUDIO_SECONDS) {
    throw new Error(
      `Audio is ${Math.round(audioSeconds / 60)} minutes, over the ${MAX_AUDIO_SECONDS / 60}-minute limit`
    );
  }

  const spent = usage[month]?.estimatedUsd ?? 0;
  if (spent + estimatedUsd > monthlyBudgetUsd) {
    throw new Error(
      `Monthly transcription budget exceeded: $${spent.toFixed(2)} spent in ${month}, ` +
        `this episode ~$${estimatedUsd.toFixed(2)}, budget $${monthlyBudgetUsd.toFixed(2)}`
    );
  }
}

export function recordUsage(
  usage: TranscriptionUsage,
  month: string,
  guid: string,
  audioSeconds: number,
  estimatedUsd: number
): TranscriptionUsage {
  const current = usage[month] ?? {
    audioSeconds: 0,
    estimatedUsd: 0,
    episodes: [],
  };
  return {
    ...usage,
    [month]: {
      audioSeconds: current.audioSeconds + Math.round(audioSeconds),
      estimatedUsd: Number((current.estimatedUsd + estimatedUsd).toFixed(4)),
      episodes: [...current.episodes, guid],
    },
  };
}
