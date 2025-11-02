import fs from 'fs';
import { config } from 'dotenv';
import { generateHighlights } from '../src/utils/groq/generateHighlights';
import { getTranscriptByGuid } from '../src/utils/getTranscriptByGuid';
import { getTranscriptJsonFilePath } from '../src/utils/getTranscriptJsonFilePath';

// Load environment variables from .env file
config();

/**
 * Main function to generate highlights for a transcript
 */
async function generateTranscriptHighlights(guid: string): Promise<void> {
  console.log(`\n✨ Generating highlights for: ${guid}\n`);

  const transcript = getTranscriptByGuid(guid);

  // Check if highlights already exist
  if (transcript.highlight1 || transcript.highlight2 || transcript.highlight3) {
    const answer = process.argv.includes('--force');
    if (!answer) {
      console.log('   Highlights already exist. Use --force to regenerate.');
      return;
    }
    console.log('   Regenerating highlights (--force flag used)...');
  }

  // Generate highlights
  const highlights = await generateHighlights(transcript.fullText);

  // Add highlights to transcript
  transcript.highlight1 = highlights[0] || '';
  transcript.highlight2 = highlights[1] || '';
  transcript.highlight3 = highlights[2] || '';

  const jsonPath = getTranscriptJsonFilePath(guid);
  // Save updated transcript
  fs.writeFileSync(jsonPath, JSON.stringify(transcript, null, 2), 'utf-8');

  console.log(`\n✅ Highlights generated successfully!`);
  console.log(`   Highlight 1: ${transcript.highlight1}`);
  console.log(`   Highlight 2: ${transcript.highlight2}`);
  console.log(`   Highlight 3: ${transcript.highlight3}\n`);
}

// Main execution
const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));

if (args.length < 1) {
  console.error('Usage: tsx scripts/generate-highlights.ts <guid> [--force]');
  console.error('\nExample:');
  console.error(
    '  tsx scripts/generate-highlights.ts cc15a703-73c7-406b-8abc-ad7d0a192d05'
  );
  console.error(
    '  tsx scripts/generate-highlights.ts cc15a703-73c7-406b-8abc-ad7d0a192d05 --force'
  );
  console.error('\nOptions:');
  console.error(
    '  --force    Regenerate highlights even if they already exist'
  );
  process.exit(1);
}

const [guid] = args;

generateTranscriptHighlights(guid)
  .then(() => {
    console.log('Done!');
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
