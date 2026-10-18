/**
 * Re-apply the corrections in src/data/glossary.json to existing transcripts,
 * e.g. after adding new entries. No transcription API is called.
 *
 * Usage:
 *   tsx scripts/apply-glossary.ts <episode-guid>   one episode
 *   tsx scripts/apply-glossary.ts --all            every Scribe transcript
 */

import fs from 'fs';
import path from 'path';
import { getTranscriptJsonFilePath } from '../src/utils/getTranscriptJsonFilePath';
import { applyCorrections, readGlossary } from '../src/utils/glossary/glossary';
import type { TranscriptJSON } from '../src/types';

function applyToTranscript(guid: string): boolean {
  const jsonPath = getTranscriptJsonFilePath(guid);
  const original = fs.readFileSync(jsonPath, 'utf-8');
  const transcript = JSON.parse(original) as TranscriptJSON;
  const { corrections } = readGlossary();

  transcript.fullText = applyCorrections(transcript.fullText, corrections);
  for (const utterance of transcript.utterances) {
    utterance.text = applyCorrections(utterance.text, corrections);
  }

  const updated = JSON.stringify(transcript, null, 2);
  if (updated === original) return false;
  fs.writeFileSync(jsonPath, updated, 'utf-8');
  return true;
}

function scribeTranscriptGuids(): string[] {
  const dir = path.join(process.cwd(), 'public', 'transcripts');
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''))
    .filter((guid) => {
      const transcript = JSON.parse(
        fs.readFileSync(getTranscriptJsonFilePath(guid), 'utf-8')
      ) as TranscriptJSON;
      return transcript.transcriber === 'elevenlabs-scribe-v2';
    });
}

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: tsx scripts/apply-glossary.ts <episode-guid> | --all');
  process.exit(1);
}

const guids = arg === '--all' ? scribeTranscriptGuids() : [arg];
const changed = guids.filter(applyToTranscript);
console.log(`Updated ${changed.length} of ${guids.length} transcript(s)`);
changed.forEach((guid) => console.log(`  ${guid}`));
