#!/usr/bin/env node
/**
 * Script to update episodes.json with Spotify URLs
 *
 * Usage:
 *   npm run update-spotify-urls              # Update all episodes missing Spotify URLs
 *   npm run update-spotify-urls <guid>       # Update a specific episode by GUID
 *
 * Example:
 *   npm run update-spotify-urls
 *   npm run update-spotify-urls cc15a703-73c7-406b-8abc-ad7d0a192d05
 *
 * Environment Variables:
 *   SPOTIFY_CLIENT_ID - Your Spotify Client ID
 *   SPOTIFY_CLIENT_SECRET - Your Spotify Client Secret
 *   SPOTIFY_SHOW_ID - Your Spotify Show ID (optional, defaults to hardcoded value)
 */

import "dotenv/config";
import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import {
  getSpotifyAccessToken,
  getSpotifyShowEpisodes,
  findSpotifyEpisodeByTitle,
} from "../src/utils/spotify.ts";

interface Episode {
  guid: string;
  title: string;
  spotifyUrl?: string;
  [key: string]: any;
}

interface EpisodesData {
  channel: any;
  episodes: Episode[];
}

// Your Spotify Show ID - from https://open.spotify.com/show/0bj38cgbe71oCr5Q0emwvA
const DEFAULT_SHOW_ID = "0bj38cgbe71oCr5Q0emwvA";

async function updateSpotifyUrls(specificGuid?: string): Promise<void> {
  // 1. Get environment variables
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const showId = process.env.SPOTIFY_SHOW_ID || DEFAULT_SHOW_ID;

  if (!clientId) {
    throw new Error("SPOTIFY_CLIENT_ID environment variable is required");
  }

  if (!clientSecret) {
    throw new Error("SPOTIFY_CLIENT_SECRET environment variable is required");
  }

  // 2. Load episodes.json
  const episodesPath = resolve(
    process.cwd(),
    "public/rss/20251015-1451-episodes.json"
  );
  const episodesContent = await readFile(episodesPath, "utf-8");
  const episodesData: EpisodesData = JSON.parse(episodesContent);

  // 3. Find episodes that need Spotify URLs
  let episodesToUpdate: Episode[];

  if (specificGuid) {
    console.log(`🔍 Looking for episode with GUID: ${specificGuid}\n`);
    const episode = episodesData.episodes.find(
      (ep) => ep.guid === specificGuid
    );
    if (!episode) {
      throw new Error(`Episode with GUID "${specificGuid}" not found`);
    }
    episodesToUpdate = [episode];
  } else {
    episodesToUpdate = episodesData.episodes.filter(
      (ep) => !ep.spotifyUrl || ep.spotifyUrl === ""
    );
    console.log(
      `🔍 Found ${episodesToUpdate.length} episodes without Spotify URLs\n`
    );
  }

  if (episodesToUpdate.length === 0) {
    console.log("✅ All episodes already have Spotify URLs!");
    return;
  }

  // 4. Get Spotify access token
  console.log(`🔐 Authenticating with Spotify...`);
  const accessToken = await getSpotifyAccessToken(clientId, clientSecret);
  console.log(`✅ Successfully authenticated with Spotify\n`);

  // 5. Get all episodes from Spotify show
  console.log(`🎵 Fetching all episodes from Spotify show...`);
  const spotifyEpisodes = await getSpotifyShowEpisodes(showId, accessToken);
  console.log(`✅ Found ${spotifyEpisodes.length} episodes in Spotify\n`);

  // 6. Update episodes with Spotify URLs
  let updatedCount = 0;
  let notFoundCount = 0;

  for (const episode of episodesToUpdate) {
    console.log(`\n🔎 Processing: "${episode.title}"`);

    const spotifyUrl = findSpotifyEpisodeByTitle(
      spotifyEpisodes,
      episode.title
    );

    if (spotifyUrl) {
      episode.spotifyUrl = spotifyUrl;
      updatedCount++;
      console.log(`   ✅ Found: ${spotifyUrl}`);
    } else {
      notFoundCount++;
      console.log(`   ❌ Not found in Spotify`);
    }
  }

  // 7. Save updated episodes.json
  if (updatedCount > 0) {
    await writeFile(
      episodesPath,
      JSON.stringify(episodesData, null, 2) + "\n",
      "utf-8"
    );
    console.log(
      `\n✅ Successfully updated ${updatedCount} episode(s) in ${episodesPath}`
    );
  }

  // 8. Summary
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Updated: ${updatedCount}`);
  console.log(`   ❌ Not found: ${notFoundCount}`);
  console.log(`   📝 Total processed: ${episodesToUpdate.length}`);
}

// Main execution
const specificGuid = process.argv[2];

updateSpotifyUrls(specificGuid).catch((error) => {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
});
