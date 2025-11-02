#!/usr/bin/env node
/**
 * Script to find Spotify URL for an episode by GUID
 *
 * Usage:
 *   npm run find-spotify-url <guid>
 *
 * Example:
 *   npm run find-spotify-url cc15a703-73c7-406b-8abc-ad7d0a192d05
 */

import 'dotenv/config';
import {
  getSpotifyAccessToken,
  getSpotifyShowEpisodes,
  findSpotifyEpisodeByTitle,
} from '../src/utils/spotify.ts';
import { getSpotifyConfidentials } from '../src/utils/spotify/getSpotifyConfidentials';
import { getEpisodeByGuid } from '../src/utils/getEpisodeByGuid.ts';

async function findSpotifyUrlByGuid(guid: string): Promise<void> {
  const { clientId, clientSecret, showId } = getSpotifyConfidentials();

  const episode = getEpisodeByGuid({ guid });
  if (!episode) {
    throw new Error(`Episode with GUID "${guid}" not found in episodes.json`);
  }

  console.log(`📝 Found episode: "${episode.title}"`);

  if (episode.spotifyUrl) {
    console.log(`✅ Spotify URL already exists: ${episode.spotifyUrl}`);
    return;
  }

  console.log(`\n🔐 Authenticating with Spotify...`);

  // 4. Get Spotify access token
  const accessToken = await getSpotifyAccessToken(clientId, clientSecret);
  console.log(`✅ Successfully authenticated with Spotify\n`);

  // 5. Get all episodes from Spotify show
  console.log(`🎵 Fetching all episodes from Spotify show...`);
  const spotifyEpisodes = await getSpotifyShowEpisodes(showId, accessToken);
  console.log(`✅ Found ${spotifyEpisodes.length} episodes in Spotify\n`);

  // 6. Find matching episode by title
  console.log(`🔎 Searching for matching episode by title...`);
  const spotifyUrl = findSpotifyEpisodeByTitle(spotifyEpisodes, episode.title);

  if (spotifyUrl) {
    console.log(`✅ Found Spotify URL: ${spotifyUrl}`);
    console.log(`\n📋 To update the episodes.json, you can use:`);
    console.log(`   - Manually add the URL to the episode`);
    console.log(`   - Or use the batch update script if you create one`);
  } else {
    console.log(`❌ Could not find matching episode in Spotify`);
    console.log(`\n💡 Tips:`);
    console.log(`   - Check if the episode title matches exactly`);
    console.log(`   - The episode might not be published on Spotify yet`);
    console.log(`   - Try checking the title in Spotify manually`);
  }
}

// Main execution
const guid = process.argv[2];

if (!guid) {
  console.error('❌ Error: GUID is required');
  console.log('\nUsage:');
  console.log('  npm run find-spotify-url <guid>');
  console.log('\nExample:');
  console.log(
    '  npm run find-spotify-url cc15a703-73c7-406b-8abc-ad7d0a192d05'
  );
  console.log('\nEnvironment Variables Required:');
  console.log('  SPOTIFY_CLIENT_ID=your_client_id');
  console.log('  SPOTIFY_CLIENT_SECRET=your_client_secret');
  console.log('  SPOTIFY_SHOW_ID=your_show_id (optional)');
  process.exit(1);
}

findSpotifyUrlByGuid(guid).catch((error) => {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
});
