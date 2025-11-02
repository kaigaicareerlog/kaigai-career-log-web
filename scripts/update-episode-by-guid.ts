#!/usr/bin/env node
/**
 * Script to manually update URLs for a specific episode by GUID
 *
 * Usage:
 *   npm run update-episode-by-guid <episodes-file> <guid> [options]
 *
 * Example:
 *   npm run update-episode-by-guid public/rss/20251015-1451-episodes.json cc15a703-73c7-406b-8abc-ad7d0a192d05 \
 *     --spotify "https://open.spotify.com/episode/xxx" \
 *     --youtube "https://youtu.be/xxx"
 *
 * Options:
 *   --spotify <url>        Spotify URL
 *   --youtube <url>        YouTube URL
 *   --apple <url>          Apple Podcast URL
 *   --amazon <url>         Amazon Music URL
 */

import { readFile, writeFile } from 'fs/promises';

interface Episode {
  guid: string;
  title: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  applePodcastUrl?: string;
  amazonMusicUrl?: string;
  [key: string]: any;
}

interface UpdateOptions {
  spotifyUrl?: string;
  youtubeUrl?: string;
  applePodcastUrl?: string;
  amazonMusicUrl?: string;
}

/**
 * Parse command-line arguments
 */
function parseArgs(args: string[]): {
  episodesFile: string;
  guid: string;
  options: UpdateOptions;
} {
  if (args.length < 2) {
    throw new Error('Episodes file path and GUID are required');
  }

  const episodesFile = args[0];
  const guid = args[1];
  const options: UpdateOptions = {};

  // Parse optional URL arguments
  for (let i = 2; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    if (!value) {
      throw new Error(`Missing value for ${flag}`);
    }

    switch (flag) {
      case '--spotify':
        options.spotifyUrl = value;
        break;
      case '--youtube':
        options.youtubeUrl = value;
        break;
      case '--apple':
        options.applePodcastUrl = value;
        break;
      case '--amazon':
        options.amazonMusicUrl = value;
        break;
      default:
        throw new Error(`Unknown flag: ${flag}`);
    }
  }

  return { episodesFile, guid, options };
}

/**
 * Update episode URLs by GUID
 */
async function updateEpisodeByGuid(
  episodesFile: string,
  guid: string,
  options: UpdateOptions
): Promise<void> {
  console.log(`\n🔍 Loading episodes from: ${episodesFile}`);

  // 1. Load episodes.json
  const episodesContent = await readFile(episodesFile, 'utf-8');
  const parsedData = JSON.parse(episodesContent);

  // Handle both old format (with channel) and new format (array only)
  const episodes: Episode[] = Array.isArray(parsedData)
    ? parsedData
    : parsedData.episodes || [];

  // 2. Find episode by GUID
  const episode = episodes.find((ep) => ep.guid === guid);

  if (!episode) {
    throw new Error(`Episode with GUID "${guid}" not found`);
  }

  console.log(`\n📝 Found episode: "${episode.title}"`);

  // 3. Check if there are any URLs to update
  if (Object.keys(options).length === 0) {
    throw new Error(
      'No URLs provided. Use --spotify, --youtube, --apple, or --amazon flags'
    );
  }

  // 4. Update URLs
  let updatedCount = 0;
  console.log(`\n🔄 Updating URLs:`);

  if (options.spotifyUrl !== undefined) {
    const oldValue = episode.spotifyUrl || '(empty)';
    episode.spotifyUrl = options.spotifyUrl;
    console.log(`   🎵 Spotify: ${oldValue} → ${options.spotifyUrl}`);
    updatedCount++;
  }

  if (options.youtubeUrl !== undefined) {
    const oldValue = episode.youtubeUrl || '(empty)';
    episode.youtubeUrl = options.youtubeUrl;
    console.log(`   🎥 YouTube: ${oldValue} → ${options.youtubeUrl}`);
    updatedCount++;
  }

  if (options.applePodcastUrl !== undefined) {
    const oldValue = episode.applePodcastUrl || '(empty)';
    episode.applePodcastUrl = options.applePodcastUrl;
    console.log(
      `   🍎 Apple Podcast: ${oldValue} → ${options.applePodcastUrl}`
    );
    updatedCount++;
  }

  if (options.amazonMusicUrl !== undefined) {
    const oldValue = episode.amazonMusicUrl || '(empty)';
    episode.amazonMusicUrl = options.amazonMusicUrl;
    console.log(`   📦 Amazon Music: ${oldValue} → ${options.amazonMusicUrl}`);
    updatedCount++;
  }

  // 5. Save updated episodes.json
  // Save as array format (new format)
  await writeFile(
    episodesFile,
    JSON.stringify(episodes, null, 2) + '\n',
    'utf-8'
  );

  console.log(
    `\n✅ Successfully updated ${updatedCount} URL(s) in ${episodesFile}`
  );
  console.log(`\n📊 Episode Summary:`);
  console.log(`   GUID: ${episode.guid}`);
  console.log(`   Title: ${episode.title}`);
  console.log(`   Spotify: ${episode.spotifyUrl || '(not set)'}`);
  console.log(`   YouTube: ${episode.youtubeUrl || '(not set)'}`);
  console.log(`   Apple Podcast: ${episode.applePodcastUrl || '(not set)'}`);
  console.log(`   Amazon Music: ${episode.amazonMusicUrl || '(not set)'}`);
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Error: Episodes file and GUID are required');
  console.log('\nUsage:');
  console.log(
    '  npm run update-episode-by-guid <episodes-file> <guid> [options]'
  );
  console.log('\nOptions:');
  console.log('  --spotify <url>    Spotify URL');
  console.log('  --youtube <url>    YouTube URL');
  console.log('  --apple <url>      Apple Podcast URL');
  console.log('  --amazon <url>     Amazon Music URL');
  console.log('\nExample:');
  console.log(
    '  npm run update-episode-by-guid public/rss/20251015-1451-episodes.json cc15a703-73c7-406b-8abc-ad7d0a192d05 \\'
  );
  console.log('    --spotify "https://open.spotify.com/episode/xxx" \\');
  console.log('    --youtube "https://youtu.be/xxx"');
  process.exit(1);
}

try {
  const { episodesFile, guid, options } = parseArgs(args);
  updateEpisodeByGuid(episodesFile, guid, options).catch((error) => {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  });
} catch (error) {
  console.error(`\n❌ Error: ${(error as Error).message}`);
  process.exit(1);
}
