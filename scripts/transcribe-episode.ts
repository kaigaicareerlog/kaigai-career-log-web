/**
 * Script to transcribe a podcast episode using AssemblyAI
 * Usage: tsx scripts/transcribe-episode.ts <episode-guid>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  transcribeAudio,
  generateJSONTranscript,
} from '../src/utils/transcription.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Episode {
  title: string;
  guid: string;
  audioUrl: string;
  [key: string]: any;
}

interface EpisodesData {
  episodes: Episode[];
  [key: string]: any;
}

/**
 * Find the latest episodes file
 */
function findLatestEpisodesFile(rssDir: string): string {
  if (!fs.existsSync(rssDir)) {
    throw new Error(`RSS directory not found: ${rssDir}`);
  }

  const files = fs.readdirSync(rssDir);
  const episodesFiles = files
    .filter((file) => file.match(/^\d{8}-\d{4}-episodes\.json$/))
    .sort()
    .reverse();

  if (episodesFiles.length === 0) {
    throw new Error('No episodes files found');
  }

  return path.join(rssDir, episodesFiles[0]);
}

/**
 * Get episode by GUID
 */
function getEpisodeByGuid(guid: string): Episode {
  const rssDir = path.join(__dirname, '..', 'public', 'rss');
  const latestFile = findLatestEpisodesFile(rssDir);

  console.log(`Reading episodes from: ${latestFile}`);
  const data: EpisodesData = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));

  const episode = data.episodes.find((ep) => ep.guid === guid);

  if (!episode) {
    throw new Error(`Episode with GUID ${guid} not found`);
  }

  return episode;
}

/**
 * Save transcript JSON file
 */
function saveTranscript(guid: string, json: object): void {
  const transcriptsDir = path.join(__dirname, '..', 'public', 'transcripts');

  // Create transcripts directory if it doesn't exist
  if (!fs.existsSync(transcriptsDir)) {
    fs.mkdirSync(transcriptsDir, { recursive: true });
  }

  // Save JSON
  const jsonPath = path.join(transcriptsDir, `${guid}.json`);
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
  const episode = getEpisodeByGuid(guid);
  console.log(`Episode: ${episode.title}`);
  console.log(`Audio URL: ${episode.audioUrl}\n`);

  // Check if transcript already exists
  const transcriptsDir = path.join(__dirname, '..', 'public', 'transcripts');
  const jsonPath = path.join(transcriptsDir, `${guid}.json`);

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
