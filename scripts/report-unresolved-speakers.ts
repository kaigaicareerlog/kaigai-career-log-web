/**
 * Report placeholder speaker labels still stored on a transcript.
 * Does not call a transcription or naming API and does not change the file.
 *
 * Usage: tsx scripts/report-unresolved-speakers.ts <episode-guid>
 * Exits 1 when a label such as "A" or "speaker_3" remains.
 */

import fs from 'fs';
import { readTranscriptIfExists } from '../src/utils/transcript/readTranscriptIfExists';
import {
  getSpeakerDisplayName,
  isUnresolvedSpeakerLabel,
} from '../src/utils/transcript/speakerLabel';

const guid = process.argv[2];

if (!guid) {
  console.error(
    'Usage: tsx scripts/report-unresolved-speakers.ts <episode-guid>'
  );
  process.exit(1);
}

const transcript = readTranscriptIfExists(guid);

if (!transcript) {
  report(
    `No transcript file for ${guid}, so speaker labels could not be checked.`
  );
  process.exit(1);
}

const unresolved = [
  ...new Set(
    (transcript.utterances ?? [])
      .map((utterance) => utterance.speaker)
      .filter((speaker) => isUnresolvedSpeakerLabel(speaker))
  ),
];

if (unresolved.length === 0) {
  console.log(`Speaker labels for ${guid} are resolved.`);
  process.exit(0);
}

report(
  [
    `Unresolved speaker labels remain for ${guid}.`,
    'They are shown with a neutral label and were not assigned to a person:',
    ...unresolved.map(
      (label) => `- \`${label}\` is shown as ${getSpeakerDisplayName(label)}`
    ),
    'Set the names with the Update Transcript Speakers workflow.',
  ].join('\n')
);
process.exit(1);

function report(message: string): void {
  console.error(message);
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) fs.appendFileSync(summary, `${message}\n`);
}
