#!/usr/bin/env node
/**
 * Script to automatically find and update Spotify, YouTube & Apple Podcasts URLs for new episodes
 * This script is designed to run in CI/CD after generating episodes.json
 *
 * Usage:
 *   npm run update-new-episode-urls <episodes-file-path>
 *
 * Example:
 *   npm run update-new-episode-urls public/rss/20251015-1451-episodes.json
 *
 * Environment Variables:
 *   SPOTIFY_CLIENT_ID - Your Spotify Client ID (required for Spotify)
 *   SPOTIFY_CLIENT_SECRET - Your Spotify Client Secret (required for Spotify)
 *   YOUTUBE_API_KEY - Your YouTube Data API v3 key (required for YouTube)
 *   SPOTIFY_SHOW_ID - Your Spotify Show ID (optional, defaults to hardcoded value)
 *   YOUTUBE_CHANNEL_ID - Your YouTube Channel ID (optional, defaults to hardcoded value)
 *   APPLE_PODCAST_ID - Your Apple Podcasts Show ID (optional, defaults to hardcoded value)
 *
 * Note: Apple Podcasts uses iTunes API which is free and doesn't require authentication!
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
import {
  getApplePodcastEpisodes,
  findApplePodcastEpisodeByTitle,
} from "../src/utils/apple.ts";
import {
  getAmazonMusicEpisodes,
  findAmazonMusicEpisodeByTitle,
} from "../src/utils/amazon.ts";

interface Episode {
  guid: string;
  title: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  applePodcastUrl?: string;
  amazonMusicUrl?: string;
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
const DEFAULT_APPLE_PODCAST_ID = "1818019572"; // From https://podcasts.apple.com/ca/podcast/id1818019572
const DEFAULT_AMAZON_MUSIC_SHOW_ID = "118b5e6b-1f97-4c62-97a5-754714381b40";
const DEFAULT_AMAZON_MUSIC_REGION = "co.jp";

/**
 * Main function to update URLs for new episodes
 */
async function updateNewEpisodeUrls(episodesPath: string): Promise<void> {
  // 1. Get environment variables
  const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
  const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  const spotifyShowId = process.env.SPOTIFY_SHOW_ID || DEFAULT_SPOTIFY_SHOW_ID;
  const youtubeChannelId =
    process.env.YOUTUBE_CHANNEL_ID || DEFAULT_YOUTUBE_CHANNEL_ID;
  const applePodcastId =
    process.env.APPLE_PODCAST_ID || DEFAULT_APPLE_PODCAST_ID;
  const amazonMusicShowId =
    process.env.AMAZON_MUSIC_SHOW_ID || DEFAULT_AMAZON_MUSIC_SHOW_ID;
  const amazonMusicRegion =
    process.env.AMAZON_MUSIC_REGION || DEFAULT_AMAZON_MUSIC_REGION;

  // Warn about missing credentials (but continue - Apple Podcasts doesn't need auth!)
  const warnings: string[] = [];
  if (!spotifyClientId || !spotifyClientSecret) {
    warnings.push("Spotify credentials missing - will skip Spotify URLs");
  }
  if (!youtubeApiKey) {
    warnings.push("YouTube API key missing - will skip YouTube URLs");
  }

  if (warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    warnings.forEach((w) => console.log(`   ${w}`));
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
  const episodesNeedingApple = episodesData.episodes.filter(
    (ep) => !ep.applePodcastUrl || ep.applePodcastUrl === ""
  );
  const episodesNeedingAmazon = episodesData.episodes.filter(
    (ep) => !ep.amazonMusicUrl || ep.amazonMusicUrl === ""
  );

  console.log(`\n📊 Episodes Status:`);
  console.log(`   Total episodes: ${episodesData.episodes.length}`);
  console.log(`   Missing Spotify URLs: ${episodesNeedingSpotify.length}`);
  console.log(`   Missing YouTube URLs: ${episodesNeedingYoutube.length}`);
  console.log(`   Missing Apple Podcasts URLs: ${episodesNeedingApple.length}`);
  console.log(`   Missing Amazon Music URLs: ${episodesNeedingAmazon.length}`);

  if (
    episodesNeedingSpotify.length === 0 &&
    episodesNeedingYoutube.length === 0 &&
    episodesNeedingApple.length === 0 &&
    episodesNeedingAmazon.length === 0
  ) {
    console.log("\n✅ All episodes already have URLs!");
    return;
  }

  let totalUpdated = 0;

  // 4. Update Spotify URLs if needed
  if (
    episodesNeedingSpotify.length > 0 &&
    spotifyClientId &&
    spotifyClientSecret
  ) {
    console.log(`\n🎵 Updating Spotify URLs...`);
    console.log(`🔐 Authenticating with Spotify...`);

    const spotifyAccessToken = await getSpotifyAccessToken(
      spotifyClientId,
      spotifyClientSecret
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
  } else if (episodesNeedingSpotify.length > 0) {
    console.log(`\n⏭️  Skipping Spotify URLs (credentials not provided)`);
  }

  // 5. Update YouTube URLs if needed
  if (episodesNeedingYoutube.length > 0 && youtubeApiKey) {
    console.log(`\n🎥 Updating YouTube URLs...`);
    console.log(`🎥 Fetching all videos from YouTube channel...`);

    const youtubeVideos = await getYouTubeChannelVideos(
      youtubeChannelId,
      youtubeApiKey
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
  } else if (episodesNeedingYoutube.length > 0) {
    console.log(`\n⏭️  Skipping YouTube URLs (API key not provided)`);
  }

  // 6. Update Apple Podcasts URLs if needed (no auth required!)
  if (episodesNeedingApple.length > 0) {
    console.log(`\n🍎 Updating Apple Podcasts URLs...`);
    console.log(`🍎 Fetching all episodes from Apple Podcasts...`);

    const applePodcastEpisodes = await getApplePodcastEpisodes(applePodcastId);
    console.log(
      `✅ Found ${applePodcastEpisodes.length} episodes in Apple Podcasts`
    );

    let appleUpdated = 0;
    for (const episode of episodesNeedingApple) {
      console.log(`\n   🔎 Processing: "${episode.title}"`);
      const appleUrl = findApplePodcastEpisodeByTitle(
        applePodcastEpisodes,
        episode.title
      );

      if (appleUrl) {
        episode.applePodcastUrl = appleUrl;
        appleUpdated++;
        console.log(`      ✅ Found Apple Podcasts URL: ${appleUrl}`);
      } else {
        console.log(`      ❌ Apple Podcasts URL not found`);
      }
    }

    console.log(
      `\n   📊 Apple Podcasts: Updated ${appleUpdated}/${episodesNeedingApple.length} episodes`
    );
    totalUpdated += appleUpdated;
  }

  // 7. Update Amazon Music URLs if needed (requires Puppeteer)
  if (episodesNeedingAmazon.length > 0) {
    console.log(`\n📦 Updating Amazon Music URLs...`);
    console.log(`   Using browser automation (this may take a minute)...`);

    try {
      const amazonEpisodes = await getAmazonMusicEpisodes(
        amazonMusicShowId,
        amazonMusicRegion
      );
      console.log(`✅ Found ${amazonEpisodes.length} episodes on Amazon Music`);

      let amazonUpdated = 0;
      for (const episode of episodesNeedingAmazon) {
        console.log(`\n   🔎 Processing: "${episode.title}"`);
        const amazonUrl = findAmazonMusicEpisodeByTitle(
          amazonEpisodes,
          episode.title
        );

        if (amazonUrl) {
          episode.amazonMusicUrl = amazonUrl;
          amazonUpdated++;
          console.log(`      ✅ Found Amazon Music URL: ${amazonUrl}`);
        } else {
          console.log(`      ❌ Amazon Music URL not found`);
        }
      }

      console.log(
        `\n   📊 Amazon Music: Updated ${amazonUpdated}/${episodesNeedingAmazon.length} episodes`
      );
      totalUpdated += amazonUpdated;
    } catch (error) {
      console.log(`\n⚠️  Error fetching Amazon Music episodes:`);
      if (error instanceof Error) {
        console.log(`   ${error.message}`);
        if (error.message.includes("Puppeteer")) {
          console.log(`   Install with: npm install -D puppeteer`);
        }
      }
      console.log(`   Continuing without Amazon Music URLs...`);
    }
  }

  // 8. Save updated episodes.json if any changes were made
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
    console.log(`   - Episodes are not yet published on the platforms`);
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
  console.log("\nEnvironment Variables (for Spotify & YouTube):");
  console.log(
    "  SPOTIFY_CLIENT_ID=your_client_id (optional, for Spotify URLs)"
  );
  console.log(
    "  SPOTIFY_CLIENT_SECRET=your_client_secret (optional, for Spotify URLs)"
  );
  console.log("  YOUTUBE_API_KEY=your_api_key (optional, for YouTube URLs)");
  console.log("\nOptional Environment Variables:");
  console.log("  SPOTIFY_SHOW_ID=your_show_id (defaults to hardcoded value)");
  console.log(
    "  YOUTUBE_CHANNEL_ID=your_channel_id (defaults to @kaigaicareerlog)"
  );
  console.log("  APPLE_PODCAST_ID=your_podcast_id (defaults to 1818019572)");
  console.log(
    "  AMAZON_MUSIC_SHOW_ID=your_show_id (defaults to 118b5e6b-1f97-4c62-97a5-754714381b40)"
  );
  console.log("  AMAZON_MUSIC_REGION=region (defaults to 'co.jp')");
  console.log(
    "\nNote: Apple Podcasts uses iTunes API (free, no auth required!)"
  );
  console.log(
    "      Amazon Music uses browser automation (requires Puppeteer)."
  );
  console.log(
    "      At least Apple Podcasts URLs will be found even without any credentials."
  );
  process.exit(1);
}

updateNewEpisodeUrls(episodesPath).catch((error) => {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
});
