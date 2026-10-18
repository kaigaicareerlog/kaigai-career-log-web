/**
 * Script to transcribe a podcast episode with ElevenLabs Scribe v2
 * Usage: tsx scripts/transcribe-episode.ts <episode-guid> [options]
 *
 * Options:
 *   --speakers=<n>   exact speaker count, if known
 *   --force          redo an episode already done with Scribe
 *
 * Scribe runs are checked against a monthly budget before any audio is sent
 * (MONTHLY_TRANSCRIPTION_BUDGET_USD, default $5) and recorded in
 * src/data/transcriptionUsage.json. Existing highlights are kept.
 */

import fs from 'fs';
import {
  assertWithinBudget,
  DEFAULT_MONTHLY_BUDGET_USD,
  estimateCostUsd,
  monthKey,
  readUsage,
  recordUsage,
  writeUsage,
} from '../src/utils/elevenlabs/budget';
import { toTranscriptJSON } from '../src/utils/elevenlabs/toTranscriptJSON';
import { transcribeAudioWithElevenLabs } from '../src/utils/elevenlabs/transcription';
import { getEpisodeMeta } from '../src/utils/episodeMeta/episodeMetaFile';
import { parseDurationToSeconds } from '../src/utils/formatters';
import { getEpisodeByGuid } from '../src/utils/getEpisodeByGuid';
import { getTranscriptJsonFilePath } from '../src/utils/getTranscriptJsonFilePath';
import { buildKeyterms, readGlossary } from '../src/utils/glossary/glossary';
import type { PodcastEpisode, TranscriptJSON } from '../src/types';
import 'dotenv/config';

function getOption(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv
    .find((arg) => arg.startsWith(prefix))
    ?.slice(prefix.length);
}

function readExistingTranscript(guid: string): TranscriptJSON | null {
  const jsonPath = getTranscriptJsonFilePath(guid);
  return fs.existsSync(jsonPath)
    ? (JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as TranscriptJSON)
    : null;
}

/**
 * Save transcript JSON file, keeping highlights from the previous transcript
 * so already-posted highlights don't change
 */
function saveTranscript(
  guid: string,
  json: object,
  existing: TranscriptJSON | null
): void {
  const jsonPath = getTranscriptJsonFilePath(guid);
  const highlights = existing
    ? {
        highlight1: existing.highlight1,
        highlight2: existing.highlight2,
        highlight3: existing.highlight3,
      }
    : {};
  fs.writeFileSync(
    jsonPath,
    JSON.stringify({ ...json, ...highlights }, null, 2),
    'utf-8'
  );

  console.log(`✅ Saved JSON transcript: ${jsonPath}`);
}

async function transcribeWithScribe(
  episode: PodcastEpisode,
  numSpeakers: number | undefined
) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable is required');
  }

  const durationSeconds = parseDurationToSeconds(episode.duration);
  if (!durationSeconds) {
    throw new Error(
      `Cannot read episode duration "${episode.duration}", so the cost can't be checked`
    );
  }

  const glossary = readGlossary();
  const keyterms = buildKeyterms(glossary, getEpisodeMeta(episode.guid));

  // Refuse before sending any audio if this would go over the budget
  const month = monthKey(new Date());
  const usage = readUsage();
  const estimatedUsd = estimateCostUsd(durationSeconds, {
    withKeyterms: keyterms.length > 0,
  });
  const monthlyBudgetUsd = Number(
    process.env.MONTHLY_TRANSCRIPTION_BUDGET_USD ?? DEFAULT_MONTHLY_BUDGET_USD
  );
  assertWithinBudget({
    usage,
    month,
    audioSeconds: durationSeconds,
    estimatedUsd,
    monthlyBudgetUsd,
  });

  console.log(
    `💰 Estimated cost: $${estimatedUsd.toFixed(2)} ` +
      `(spent this month: $${(usage[month]?.estimatedUsd ?? 0).toFixed(2)} / $${monthlyBudgetUsd.toFixed(2)})`
  );
  console.log(`🔑 Keyterms (${keyterms.length}): ${keyterms.join(', ')}`);
  console.log(
    '🔄 Sending audio to ElevenLabs Scribe (this may take minutes)...'
  );

  const result = await transcribeAudioWithElevenLabs(episode.audioUrl, apiKey, {
    numSpeakers,
    keyterms,
  });

  // Record as soon as the call succeeds so a later failure doesn't hide spend
  writeUsage(
    recordUsage(usage, month, episode.guid, durationSeconds, estimatedUsd)
  );

  console.log(
    `   Speakers: ${new Set(result.utterances.map((u) => u.speaker)).size}`
  );
  console.log(`   Utterances: ${result.utterances.length}`);

  return toTranscriptJSON({
    result,
    episodeGuid: episode.guid,
    episodeTitle: episode.title,
    durationSeconds,
    corrections: glossary.corrections,
  });
}

/**
 * Main transcription function
 */
async function transcribeEpisode(guid: string): Promise<void> {
  const speakersOption = getOption('speakers');
  const numSpeakers = speakersOption ? Number(speakersOption) : undefined;
  if (numSpeakers !== undefined && !(numSpeakers >= 1 && numSpeakers <= 32)) {
    throw new Error('--speakers must be a number from 1 to 32');
  }

  console.log(`\n🎙️  Starting transcription for episode: ${guid}\n`);

  const episode = getEpisodeByGuid({ guid });
  if (!episode) {
    throw new Error(`Episode not found: ${guid}`);
  }
  console.log(`Episode: ${episode.title}`);
  console.log(`Audio URL: ${episode.audioUrl}\n`);

  const existing = readExistingTranscript(guid);
  if (
    existing?.transcriber === 'elevenlabs-scribe-v2' &&
    !process.argv.includes('--force')
  ) {
    console.log('⏭️  Already transcribed with Scribe. Use --force to redo it.');
    return;
  }
  if (existing) {
    console.log(
      '⚠️  Transcript already exists; overwriting (highlights kept)\n'
    );
  }

  const json = await transcribeWithScribe(episode, numSpeakers);

  saveTranscript(guid, json, existing);
  console.log('\n✨ Transcription complete!\n');
}

// Main execution
const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));

if (args.length < 1) {
  console.error(
    'Usage: tsx scripts/transcribe-episode.ts <episode-guid> [--speakers=<n>] [--force]'
  );
  process.exit(1);
}

const episodeGuid = args[0];

transcribeEpisode(episodeGuid)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', (error as Error).message);
    process.exit(1);
  });
