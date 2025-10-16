/**
 * Script to update speaker labels in a transcript
 * Usage: tsx scripts/update-transcript-speakers.ts <guid> <old-speaker> <new-speaker>
 * Examples:
 *   tsx scripts/update-transcript-speakers.ts <guid> A Ryo
 *   tsx scripts/update-transcript-speakers.ts <guid> B "John Smith"
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Update speaker labels in transcript
 */
function updateSpeakers(
  guid: string,
  oldSpeaker: string,
  newSpeaker: string
): void {
  console.log(`\n🎙️  Updating speakers in transcript: ${guid}\n`);

  // Validate new speaker name is not empty
  if (!newSpeaker || newSpeaker.trim() === "") {
    throw new Error("New speaker name cannot be empty");
  }

  // Load transcript
  const transcriptsDir = path.join(__dirname, "..", "public", "transcripts");
  const jsonPath = path.join(transcriptsDir, `${guid}.json`);

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Transcript not found: ${jsonPath}`);
  }

  const transcript = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  // Count occurrences
  let updateCount = 0;
  const utterances = transcript.utterances || [];

  // Update speakers
  utterances.forEach((utterance: any) => {
    if (utterance.speaker === oldSpeaker) {
      utterance.speaker = newSpeaker;
      updateCount++;
    }
  });

  if (updateCount === 0) {
    console.log(`⚠️  No utterances found with speaker "${oldSpeaker}"`);
    return;
  }

  // Save updated transcript
  fs.writeFileSync(jsonPath, JSON.stringify(transcript, null, 2), "utf-8");

  console.log(`✅ Updated ${updateCount} utterances`);
  console.log(`   Changed: "${oldSpeaker}" → "${newSpeaker}"\n`);
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error(
    "Usage: tsx scripts/update-transcript-speakers.ts <guid> <old-speaker> <new-speaker>"
  );
  console.error("\nExamples:");
  console.error("  tsx scripts/update-transcript-speakers.ts <guid> A Ryo");
  console.error("  tsx scripts/update-transcript-speakers.ts <guid> B Senna");
  console.error("  tsx scripts/update-transcript-speakers.ts <guid> C Ayaka");
  console.error(
    '  tsx scripts/update-transcript-speakers.ts <guid> D "John Smith"'
  );
  console.error("\nNote: Use quotes for multi-word names");
  process.exit(1);
}

const [guid, oldSpeaker, newSpeaker] = args;

try {
  updateSpeakers(guid, oldSpeaker, newSpeaker);
  process.exit(0);
} catch (error) {
  console.error("\n❌ Error:", (error as Error).message);
  process.exit(1);
}
