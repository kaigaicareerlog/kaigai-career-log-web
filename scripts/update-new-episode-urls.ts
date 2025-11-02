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

import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import {
  getSpotifyAccessToken,
  getSpotifyConfidentials,
  getSpotifyShowEpisodes,
  findSpotifyEpisodeByTitle,
} from '../src/utils/spotify';
import {
  getYoutubeConfidentials,
  getYouTubeChannelVideos,
  findYouTubeVideoByTitle,
} from '../src/utils/youtube';
import {
  getApplePodcastConfidentials,
  getApplePodcastEpisodes,
  findApplePodcastEpisodeByTitle,
} from '../src/utils/apple_podcast';
import {
  getAmazonMusicConfidentials,
  getAmazonMusicEpisodes,
  findAmazonMusicEpisodeByTitle,
} from '../src/utils/amazon_music';
import type { PodcastEpisode } from '../src/types';

/**
 * Main function to update URLs for new episodes
 */
async function updateNewEpisodeUrls(episodesPath: string): Promise<void> {
  // 1. Get environment variables
  const {
    clientId: spotifyClientId,
    clientSecret: spotifyClientSecret,
    showId: spotifyShowId,
  } = getSpotifyConfidentials();
  const { apiKey: youtubeApiKey, channelId: youtubeChannelId } =
    getYoutubeConfidentials();
  const { podcastId: applePodcastId } = getApplePodcastConfidentials();
  const { showId: amazonMusicShowId, region: amazonMusicRegion } =
    getAmazonMusicConfidentials();

  console.log(`\n🔍 Loading episodes from: ${episodesPath}`);

  // 2. Load episodes.json
  const episodesContent = await readFile(episodesPath, 'utf-8');
  const episodes: PodcastEpisode[] = JSON.parse(episodesContent);

  // 3. Find episodes that need URLs
  const episodesNeedingSpotify = episodes.filter(
    (ep) => !ep.spotifyUrl || ep.spotifyUrl === ''
  );
  const episodesNeedingYoutube = episodes.filter(
    (ep) => !ep.youtubeUrl || ep.youtubeUrl === ''
  );
  const episodesNeedingApple = episodes.filter(
    (ep) => !ep.applePodcastUrl || ep.applePodcastUrl === ''
  );
  const episodesNeedingAmazon = episodes.filter(
    (ep) => !ep.amazonMusicUrl || ep.amazonMusicUrl === ''
  );

  console.log(`\n📊 Episodes Status:`);
  console.log(`   Total episodes: ${episodes.length}`);
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
    console.log('\n✅ All episodes already have URLs!');
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
        if (error.message.includes('Puppeteer')) {
          console.log(`   Install with: npm install -D puppeteer`);
        }
      }
      console.log(`   Continuing without Amazon Music URLs...`);
    }
  }

  // 8. Save updated episodes.json if any changes were made
  if (totalUpdated > 0) {
    // Save as array format (new format)
    await writeFile(
      episodesPath,
      JSON.stringify(episodes, null, 2) + '\n',
      'utf-8'
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
  console.error('❌ Error: Episodes file path is required');
  console.log('\nUsage:');
  console.log('  npm run update-new-episode-urls <episodes-file-path>');
  console.log('\nExample:');
  console.log(
    '  npm run update-new-episode-urls public/rss/20251015-1451-episodes.json'
  );
  console.log('\nEnvironment Variables (for Spotify & YouTube):');
  console.log(
    '  SPOTIFY_CLIENT_ID=your_client_id (optional, for Spotify URLs)'
  );
  console.log(
    '  SPOTIFY_CLIENT_SECRET=your_client_secret (optional, for Spotify URLs)'
  );
  console.log('  YOUTUBE_API_KEY=your_api_key (optional, for YouTube URLs)');
  console.log('\nOptional Environment Variables:');
  console.log('  SPOTIFY_SHOW_ID=your_show_id (defaults to hardcoded value)');
  console.log(
    '  YOUTUBE_CHANNEL_ID=your_channel_id (defaults to @kaigaicareerlog)'
  );
  console.log('  APPLE_PODCAST_ID=your_podcast_id (defaults to 1818019572)');
  console.log(
    '  AMAZON_MUSIC_SHOW_ID=your_show_id (defaults to 118b5e6b-1f97-4c62-97a5-754714381b40)'
  );
  console.log("  AMAZON_MUSIC_REGION=region (defaults to 'co.jp')");
  console.log(
    '\nNote: Apple Podcasts uses iTunes API (free, no auth required!)'
  );
  console.log(
    '      Amazon Music uses browser automation (requires Puppeteer).'
  );
  console.log(
    '      At least Apple Podcasts URLs will be found even without any credentials.'
  );
  process.exit(1);
}

updateNewEpisodeUrls(episodesPath).catch((error) => {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
});
