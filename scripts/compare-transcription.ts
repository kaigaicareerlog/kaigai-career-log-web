/**
 * Compare the existing transcript of an episode with a fresh ElevenLabs
 * Scribe transcript, side by side in one-minute windows.
 *
 * Usage: tsx scripts/compare-transcription.ts <episode-guid>
 *
 * The existing transcript in public/transcripts is used as the baseline, so
 * only ElevenLabs is called (about one hour of audio). Output goes to
 * tmp/transcription-compare/<guid>/ and is not committed.
 */

import fs from 'fs';
import path from 'path';
import { transcribeAudioWithElevenLabs } from '../src/utils/elevenlabs/transcription';
import { getEpisodeByGuid } from '../src/utils/getEpisodeByGuid';
import { getTranscriptByGuid } from '../src/utils/getTranscriptByGuid';
import 'dotenv/config';

const WINDOW_MS = 60_000;

interface Segment {
  speaker: string;
  text: string;
  start: number;
}

function textInWindow(segments: Segment[], from: number): string {
  return segments
    .filter((s) => s.start >= from && s.start < from + WINDOW_MS)
    .map((s) => `[${s.speaker}] ${s.text}`)
    .join('\n');
}

function speakerCount(segments: Segment[]): number {
  return new Set(segments.map((s) => s.speaker)).size;
}

function buildReport(
  title: string,
  baseline: Segment[],
  candidate: Segment[]
): string {
  const lastStart = Math.max(
    baseline[baseline.length - 1]?.start ?? 0,
    candidate[candidate.length - 1]?.start ?? 0
  );
  const chars = (segments: Segment[]) =>
    segments.reduce((sum, s) => sum + s.text.length, 0);

  let md = `# ${title}\n\n`;
  md += '| | 既存 | ElevenLabs Scribe |\n|---|---|---|\n';
  md += `| 発話数 | ${baseline.length} | ${candidate.length} |\n`;
  md += `| 話者数 | ${speakerCount(baseline)} | ${speakerCount(candidate)} |\n`;
  md += `| 文字数 | ${chars(baseline)} | ${chars(candidate)} |\n\n`;

  for (let from = 0; from <= lastStart; from += WINDOW_MS) {
    const minute = Math.floor(from / WINDOW_MS);
    md += `## ${minute}:00〜\n\n`;
    md += `**既存**\n\n${textInWindow(baseline, from) || '(なし)'}\n\n`;
    md += `**ElevenLabs**\n\n${textInWindow(candidate, from) || '(なし)'}\n\n`;
  }

  return md;
}

async function compare(guid: string): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable is required');
  }

  const episode = getEpisodeByGuid({ guid });
  if (!episode) {
    throw new Error(`Episode not found: ${guid}`);
  }
  const existing = getTranscriptByGuid(guid);

  console.log(`\nEpisode: ${episode.title}`);
  console.log('Sending audio to ElevenLabs Scribe (this may take minutes)...');
  const result = await transcribeAudioWithElevenLabs(
    episode.audioUrl,
    apiKey
  );

  const baseline: Segment[] = existing.utterances.map((u) => ({
    speaker: u.speaker,
    text: u.text,
    start: u.start,
  }));
  const candidate: Segment[] = result.utterances.map((u) => ({
    speaker: u.speaker,
    text: u.text,
    start: u.start,
  }));

  const outDir = path.join(process.cwd(), 'tmp', 'transcription-compare', guid);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'elevenlabs.json'),
    JSON.stringify(result, null, 2),
    'utf-8'
  );
  const reportPath = path.join(outDir, 'report.md');
  fs.writeFileSync(
    reportPath,
    buildReport(episode.title, baseline, candidate),
    'utf-8'
  );

  console.log(`\nSaved: ${reportPath}`);
  console.log(
    `Utterances: existing ${baseline.length} / Scribe ${candidate.length}`
  );
  console.log(
    `Speakers:   existing ${speakerCount(baseline)} / Scribe ${speakerCount(candidate)}\n`
  );
}

const guid = process.argv[2];
if (!guid) {
  console.error('Usage: tsx scripts/compare-transcription.ts <episode-guid>');
  process.exit(1);
}

compare(guid).catch((error) => {
  console.error('\n❌ Error:', (error as Error).message);
  process.exit(1);
});
