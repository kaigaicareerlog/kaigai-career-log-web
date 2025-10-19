#!/usr/bin/env node
/**
 * Script to find Spotify URL for an episode by GUID
 *
 * Usage:
 *   npm run find-spotify-url <guid>
 *
 * Example:
 *   npm run find-spotify-url cc15a703-73c7-406b-8abc-ad7d0a192d05
 *
 * Environment Variables:
 *   SPOTIFY_CLIENT_ID - Your Spotify Client ID
 *   SPOTIFY_CLIENT_SECRET - Your Spotify Client Secret
 *   SPOTIFY_SHOW_ID - Your Spotify Show ID (optional, defaults to hardcoded value)
 */

import 'dotenv/config';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import {
  getSpotifyAccessToken,
  getSpotifyShowEpisodes,
  findSpotifyEpisodeByTitle,
} from '../src/utils/spotify.ts';

interface Episode {
  guid: string;
  title: string;
  spotifyUrl?: string;
}

interface EpisodesData {
  episodes: Episode[];
}

// Your Spotify Show ID - from https://open.spotify.com/show/0bj38cgbe71oCr5Q0emwvA
const DEFAULT_SHOW_ID = '0bj38cgbe71oCr5Q0emwvA';

async function findSpotifyUrlByGuid(guid: string): Promise<void> {
  // 1. Get environment variables
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const showId = process.env.SPOTIFY_SHOW_ID || DEFAULT_SHOW_ID;

  if (!clientId) {
    throw new Error('SPOTIFY_CLIENT_ID environment variable is required');
  }

  if (!clientSecret) {
    throw new Error('SPOTIFY_CLIENT_SECRET environment variable is required');
  }

  console.log(`🔍 Searching for episode with GUID: ${guid}\n`);

  // 2. Load episodes.json
  const episodesPath = resolve(
    process.cwd(),
    'public/rss/20251015-1451-episodes.json'
  );
  const episodesContent = await readFile(episodesPath, 'utf-8');
  const episodesData: EpisodesData = JSON.parse(episodesContent);

  // 3. Find episode by GUID
  const episode = episodesData.episodes.find((ep) => ep.guid === guid);
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
