/**
 * Script to update speaker labels in a transcript
 * Usage: tsx scripts/update-transcript-speakers.ts <guid> <speaker-A-name> [speaker-B-name] [speaker-C-name] [speaker-D-name]
 * Examples:
 *   tsx scripts/update-transcript-speakers.ts <guid> Ryo Senna
 *   tsx scripts/update-transcript-speakers.ts <guid> Ryo "John Smith"
 *   tsx scripts/update-transcript-speakers.ts <guid> Ryo Senna Ayaka
 *   tsx scripts/update-transcript-speakers.ts <guid> "" Senna ""  # Update only B, leave A and C unchanged
 */

import fs from 'fs';
import { getTranscriptByGuid } from '../src/utils/getTranscriptByGuid';
import { getTranscriptJsonFilePath } from '../src/utils/getTranscriptJsonFilePath';
import { createLogger } from '../src/utils/logger';

interface SpeakerMapping {
  oldLabel: string;
  newName: string;
}

/**
 * Update multiple speaker labels in transcript at once
 */
function updateSpeakers(guid: string, speakerMappings: SpeakerMapping[]): void {
  const logger = createLogger({ verbose: process.env.VERBOSE === 'true' });

  logger.section('');
  logger.info(`Updating speakers in transcript: ${guid}`);

  // Filter out empty mappings
  const validMappings = speakerMappings.filter(
    (mapping) => mapping.newName && mapping.newName.trim() !== ''
  );

  if (validMappings.length === 0) {
    throw new Error('At least one speaker name must be provided');
  }

  // Load transcript
  const transcriptPath = getTranscriptJsonFilePath(guid);
  const transcript = getTranscriptByGuid(guid);

  // Count occurrences for each speaker
  const updateCounts: Record<string, number> = {};
  const utterances = transcript.utterances || [];

  // Update speakers
  utterances.forEach((utterance: any) => {
    const mapping = validMappings.find((m) => m.oldLabel === utterance.speaker);
    if (mapping) {
      utterance.speaker = mapping.newName;
      updateCounts[mapping.oldLabel] =
        (updateCounts[mapping.oldLabel] || 0) + 1;
    }
  });

  // Check if any updates were made
  if (Object.keys(updateCounts).length === 0) {
    logger.section('');
    logger.warning('No matching speakers found in transcript');
    return;
  }

  // Save updated transcript
  fs.writeFileSync(
    transcriptPath,
    JSON.stringify(transcript, null, 2),
    'utf-8'
  );

  logger.section('');
  logger.success('Successfully updated speakers:');
  validMappings.forEach((mapping) => {
    const count = updateCounts[mapping.oldLabel] || 0;
    if (count > 0) {
      logger.info(
        `"${mapping.oldLabel}" → "${mapping.newName}" (${count} utterances)`,
        1
      );
    } else {
      logger.warning(`"${mapping.oldLabel}" → "${mapping.newName}" (not found)`, 1);
    }
  });
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  const logger = createLogger();
  logger.error(
    'Usage: tsx scripts/update-transcript-speakers.ts <guid> <speaker-A-name> [speaker-B-name] [speaker-C-name] [speaker-D-name]'
  );
  logger.section('\nExamples:');
  logger.list(
    [
      'tsx scripts/update-transcript-speakers.ts <guid> Ryo Senna',
      'tsx scripts/update-transcript-speakers.ts <guid> Ryo "John Smith"',
      'tsx scripts/update-transcript-speakers.ts <guid> Ryo Senna Ayaka',
      'tsx scripts/update-transcript-speakers.ts <guid> "" Senna  # Update only B',
    ],
    1
  );
  logger.section('\nNotes:');
  logger.list(
    [
      '- Use quotes for multi-word names',
      '- Use "" (empty string) to skip a speaker',
      '- Speakers are mapped in order: A, B, C, D, ...',
    ],
    1
  );
  process.exit(1);
}

const [guid, ...speakerNames] = args;

// Build speaker mappings (A, B, C, D, ...)
const speakerLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const speakerMappings: SpeakerMapping[] = speakerNames.map((name, index) => ({
  oldLabel: speakerLabels[index],
  newName: name,
}));

try {
  updateSpeakers(guid, speakerMappings);
  process.exit(0);
} catch (error) {
  const logger = createLogger();
  logger.section('');
  logger.error(`Error: ${(error as Error).message}`);
  process.exit(1);
}
