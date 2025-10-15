#!/usr/bin/env node
/**
 * Script to automatically find and update Spotify & YouTube URLs for new episodes
 * This script is designed to run in CI/CD after generating episodes.json
 *
 * Usage:
 *   npm run update-new-episode-urls <episodes-file-path>
 *
 * Example:
 *   npm run update-new-episode-urls public/rss/20251015-1451-episodes.json
 *
 * Environment Variables (required):
 *   SPOTIFY_CLIENT_ID - Your Spotify Client ID
 *   SPOTIFY_CLIENT_SECRET - Your Spotify Client Secret
 *   YOUTUBE_API_KEY - Your YouTube Data API v3 key
 *   SPOTIFY_SHOW_ID - Your Spotify Show ID (optional, defaults to hardcoded value)
 *   YOUTUBE_CHANNEL_ID - Your YouTube Channel ID (optional, defaults to hardcoded value)
 */

import "dotenv/config";
import { readFile, writeFile } from "fs/promises";
import {
  getSpotifyAccessToken,
  getSpotifyShowEpisodes,
  findSpotifyEpisodeByTitle,
} from "../src/utils/spotify.ts";
import {
  getYouTubeChannelVideos,
  findYouTubeVideoByTitle,
} from "../src/utils/youtube.ts";

interface Episode {
  guid: string;
  title: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  [key: string]: any;
}

interface EpisodesData {
  channel: any;
  episodes: Episode[];
  lastUpdated?: string;
}

// Default values
const DEFAULT_SPOTIFY_SHOW_ID = "0bj38cgbe71oCr5Q0emwvA";
const DEFAULT_YOUTUBE_CHANNEL_ID = "@kaigaicareerlog";

/**
 * Main function to update URLs for new episodes
 */
async function updateNewEpisodeUrls(episodesPath: string): Promise<void> {
  // 1. Validate environment variables
  const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
  const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  const spotifyShowId = process.env.SPOTIFY_SHOW_ID || DEFAULT_SPOTIFY_SHOW_ID;
  const youtubeChannelId =
    process.env.YOUTUBE_CHANNEL_ID || DEFAULT_YOUTUBE_CHANNEL_ID;

  const missingVars: string[] = [];
  if (!spotifyClientId) missingVars.push("SPOTIFY_CLIENT_ID");
  if (!spotifyClientSecret) missingVars.push("SPOTIFY_CLIENT_SECRET");
  if (!youtubeApiKey) missingVars.push("YOUTUBE_API_KEY");

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  console.log(`\n🔍 Loading episodes from: ${episodesPath}`);

  // 2. Load episodes.json
  const episodesContent = await readFile(episodesPath, "utf-8");
  const episodesData: EpisodesData = JSON.parse(episodesContent);

  // 3. Find episodes that need URLs
  const episodesNeedingSpotify = episodesData.episodes.filter(
    (ep) => !ep.spotifyUrl || ep.spotifyUrl === ""
  );
  const episodesNeedingYoutube = episodesData.episodes.filter(
    (ep) => !ep.youtubeUrl || ep.youtubeUrl === ""
  );

  console.log(`\n📊 Episodes Status:`);
  console.log(`   Total episodes: ${episodesData.episodes.length}`);
  console.log(`   Missing Spotify URLs: ${episodesNeedingSpotify.length}`);
  console.log(`   Missing YouTube URLs: ${episodesNeedingYoutube.length}`);

  if (
    episodesNeedingSpotify.length === 0 &&
    episodesNeedingYoutube.length === 0
  ) {
    console.log("\n✅ All episodes already have URLs!");
    return;
  }

  let totalUpdated = 0;

  // 4. Update Spotify URLs if needed
  if (episodesNeedingSpotify.length > 0) {
    console.log(`\n🎵 Updating Spotify URLs...`);
    console.log(`🔐 Authenticating with Spotify...`);

    const spotifyAccessToken = await getSpotifyAccessToken(
      spotifyClientId!,
      spotifyClientSecret!
    );
    console.log(`✅ Successfully authenticated with Spotify`);

    console.log(`🎵 Fetching all episodes from Spotify show...`);
    const spotifyEpisodes = await getSpotifyShowEpisodes(
      spotifyShowId,
      spotifyAccessToken
    );
    console.log(`✅ Found ${spotifyEpisodes.length} episodes in Spotify`);

    let spotifyUpdated = 0;
    for (const episode of episodesNeedingSpotify) {
      console.log(`\n   🔎 Processing: "${episode.title}"`);
      const spotifyUrl = findSpotifyEpisodeByTitle(
        spotifyEpisodes,
        episode.title
      );

      if (spotifyUrl) {
        episode.spotifyUrl = spotifyUrl;
        spotifyUpdated++;
        console.log(`      ✅ Found Spotify URL: ${spotifyUrl}`);
      } else {
        console.log(`      ❌ Spotify URL not found`);
      }
    }

    console.log(
      `\n   📊 Spotify: Updated ${spotifyUpdated}/${episodesNeedingSpotify.length} episodes`
    );
    totalUpdated += spotifyUpdated;
  }

  // 5. Update YouTube URLs if needed
  if (episodesNeedingYoutube.length > 0) {
    console.log(`\n🎥 Updating YouTube URLs...`);
    console.log(`🎥 Fetching all videos from YouTube channel...`);

    const youtubeVideos = await getYouTubeChannelVideos(
      youtubeChannelId,
      youtubeApiKey!
    );
    console.log(`✅ Found ${youtubeVideos.length} videos in YouTube`);

    let youtubeUpdated = 0;
    for (const episode of episodesNeedingYoutube) {
      console.log(`\n   🔎 Processing: "${episode.title}"`);
      const youtubeUrl = findYouTubeVideoByTitle(youtubeVideos, episode.title);

      if (youtubeUrl) {
        episode.youtubeUrl = youtubeUrl;
        youtubeUpdated++;
        console.log(`      ✅ Found YouTube URL: ${youtubeUrl}`);
      } else {
        console.log(`      ❌ YouTube URL not found`);
      }
    }

    console.log(
      `\n   📊 YouTube: Updated ${youtubeUpdated}/${episodesNeedingYoutube.length} episodes`
    );
    totalUpdated += youtubeUpdated;
  }

  // 6. Save updated episodes.json if any changes were made
  if (totalUpdated > 0) {
    episodesData.lastUpdated = new Date().toISOString();
    await writeFile(
      episodesPath,
      JSON.stringify(episodesData, null, 2) + "\n",
      "utf-8"
    );
    console.log(`\n✅ Successfully updated episodes file: ${episodesPath}`);
    console.log(`   Total URLs added: ${totalUpdated}`);
  } else {
    console.log(`\n⚠️  No URLs were found for any episodes`);
    console.log(`   This might mean:`);
    console.log(`   - Episodes are not yet published on Spotify/YouTube`);
    console.log(`   - Episode titles don't match exactly`);
    console.log(`   - There's an API issue`);
  }

  console.log(`\n✨ Done!`);
}

// Main execution
const episodesPath = process.argv[2];

if (!episodesPath) {
  console.error("❌ Error: Episodes file path is required");
  console.log("\nUsage:");
  console.log("  npm run update-new-episode-urls <episodes-file-path>");
  console.log("\nExample:");
  console.log(
    "  npm run update-new-episode-urls public/rss/20251015-1451-episodes.json"
  );
  console.log("\nRequired Environment Variables:");
  console.log("  SPOTIFY_CLIENT_ID=your_client_id");
  console.log("  SPOTIFY_CLIENT_SECRET=your_client_secret");
  console.log("  YOUTUBE_API_KEY=your_api_key");
  console.log("\nOptional Environment Variables:");
  console.log("  SPOTIFY_SHOW_ID=your_show_id (defaults to hardcoded value)");
  console.log(
    "  YOUTUBE_CHANNEL_ID=your_channel_id (defaults to @kaigaicareerlog)"
  );
  process.exit(1);
}

updateNewEpisodeUrls(episodesPath).catch((error) => {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
});
