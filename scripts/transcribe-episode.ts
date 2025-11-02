/**
 * Script to transcribe a podcast episode using AssemblyAI
 * Usage: tsx scripts/transcribe-episode.ts <episode-guid>
 */

import fs from 'fs';
import {
  transcribeAudio,
  generateJSONTranscript,
} from '../src/utils/assembly_ai/transcription';
import { getEpisodeByGuid } from '../src/utils/getEpisodeByGuid';
import { getTranscriptJsonFilePath } from '../src/utils/getTranscriptJsonFilePath';
import 'dotenv/config';

/**
 * Save transcript JSON file
 */
function saveTranscript(guid: string, json: object): void {
  const jsonPath = getTranscriptJsonFilePath(guid);
  fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2), 'utf-8');

  console.log(`✅ Saved JSON transcript: ${jsonPath}`);
}

/**
 * Main transcription function
 */
async function transcribeEpisode(guid: string): Promise<void> {
  console.log(`\n🎙️  Starting transcription for episode: ${guid}\n`);

  // Get API keys from environment
  const assemblyAiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!assemblyAiKey) {
    throw new Error('ASSEMBLYAI_API_KEY environment variable is required');
  }

  // Get episode info
  const episode = getEpisodeByGuid({ guid });
  if (!episode) {
    throw new Error(`Episode not found: ${guid}`);
  }
  console.log(`Episode: ${episode.title}`);
  console.log(`Audio URL: ${episode.audioUrl}\n`);

  // Check if transcript already exists
  const jsonPath = getTranscriptJsonFilePath(guid);

  if (fs.existsSync(jsonPath)) {
    console.log('⚠️  Transcript already exists for this episode');
    console.log('   Overwriting existing transcript...\n');
  }

  // Transcribe audio
  console.log('🔄 Submitting transcription job to AssemblyAI...');
  const result = await transcribeAudio(episode.audioUrl, assemblyAiKey);

  console.log(`\n📊 Transcription Stats:`);
  console.log(`   Duration: ${Math.floor(result.audio_duration / 1000)}s`);
  console.log(
    `   Speakers: ${new Set(result.utterances.map((u) => u.speaker)).size}`
  );
  console.log(`   Utterances: ${result.utterances.length}`);
  console.log(`   Words: ${result.words.length}\n`);

  // Generate JSON output
  const json = generateJSONTranscript(result, guid, episode.title);

  // Save transcript
  saveTranscript(guid, json);

  console.log('\n✨ Transcription complete!');
  console.log('   Run cleanup script next to improve text quality.\n');
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('Usage: tsx scripts/transcribe-episode.ts <episode-guid>');
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
