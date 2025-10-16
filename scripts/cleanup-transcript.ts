/**
 * Script to clean up an existing transcript by removing extra spaces
 * Usage: tsx scripts/cleanup-transcript.ts <episode-guid>
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Simple regex cleanup - removes multiple spaces
 */
function cleanupText(text: string): string {
  // Remove multiple spaces and trim
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Main cleanup function
 */
function cleanupTranscript(guid: string): void {
  console.log(`\n🧹 Cleaning up transcript for: ${guid}\n`);

  // Load existing transcript
  const transcriptsDir = path.join(__dirname, "..", "public", "transcripts");
  const jsonPath = path.join(transcriptsDir, `${guid}.json`);

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Transcript not found: ${jsonPath}`);
  }

  const transcript = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const utterances = transcript.utterances;

  console.log(`   Total utterances: ${utterances.length}\n`);

  // Clean up utterances
  const cleanedUtterances = utterances.map((utterance: any, i: number) => {
    console.log(`   Processing ${i + 1}/${utterances.length}...`);

    return {
      ...utterance,
      text: cleanupText(utterance.text),
    };
  });

  // Update transcript
  transcript.utterances = cleanedUtterances;
  transcript.fullText = cleanedUtterances.map((u: any) => u.text).join(" ");

  // Save cleaned transcript
  fs.writeFileSync(jsonPath, JSON.stringify(transcript, null, 2), "utf-8");

  console.log(`\n✨ Cleanup complete!`);
  console.log(`   Cleaned: ${cleanedUtterances.length} utterances\n`);
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error("Usage: tsx scripts/cleanup-transcript.ts <guid>");
  console.error("\nExample:");
  console.error(
    "  tsx scripts/cleanup-transcript.ts cc15a703-73c7-406b-8abc-ad7d0a192d05"
  );
  process.exit(1);
}

const [guid] = args;

try {
  cleanupTranscript(guid);
  process.exit(0);
} catch (error) {
  console.error("\n❌ Error:", (error as Error).message);
  process.exit(1);
}
