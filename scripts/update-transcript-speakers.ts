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
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SpeakerMapping {
  oldLabel: string;
  newName: string;
}

/**
 * Update multiple speaker labels in transcript at once
 */
function updateSpeakers(guid: string, speakerMappings: SpeakerMapping[]): void {
  console.log(`\n🎙️  Updating speakers in transcript: ${guid}\n`);

  // Filter out empty mappings
  const validMappings = speakerMappings.filter(
    (mapping) => mapping.newName && mapping.newName.trim() !== ''
  );

  if (validMappings.length === 0) {
    throw new Error('At least one speaker name must be provided');
  }

  // Load transcript
  const transcriptsDir = path.join(__dirname, '..', 'public', 'transcripts');
  const jsonPath = path.join(transcriptsDir, `${guid}.json`);

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Transcript not found: ${jsonPath}`);
  }

  const transcript = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

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
    console.log('⚠️  No matching speakers found in transcript');
    return;
  }

  // Save updated transcript
  fs.writeFileSync(jsonPath, JSON.stringify(transcript, null, 2), 'utf-8');

  console.log('✅ Successfully updated speakers:\n');
  validMappings.forEach((mapping) => {
    const count = updateCounts[mapping.oldLabel] || 0;
    if (count > 0) {
      console.log(
        `   "${mapping.oldLabel}" → "${mapping.newName}" (${count} utterances)`
      );
    } else {
      console.log(
        `   "${mapping.oldLabel}" → "${mapping.newName}" (not found)`
      );
    }
  });
  console.log('');
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error(
    'Usage: tsx scripts/update-transcript-speakers.ts <guid> <speaker-A-name> [speaker-B-name] [speaker-C-name] [speaker-D-name]'
  );
  console.error('\nExamples:');
  console.error('  tsx scripts/update-transcript-speakers.ts <guid> Ryo Senna');
  console.error(
    '  tsx scripts/update-transcript-speakers.ts <guid> Ryo "John Smith"'
  );
  console.error(
    '  tsx scripts/update-transcript-speakers.ts <guid> Ryo Senna Ayaka'
  );
  console.error(
    '  tsx scripts/update-transcript-speakers.ts <guid> "" Senna  # Update only B'
  );
  console.error('\nNotes:');
  console.error('  - Use quotes for multi-word names');
  console.error('  - Use "" (empty string) to skip a speaker');
  console.error('  - Speakers are mapped in order: A, B, C, D, ...');
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
  console.error('\n❌ Error:', (error as Error).message);
  process.exit(1);
}
