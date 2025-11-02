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
import { createLogger } from '../src/utils/logger';

/**
 * Main function to update URLs for new episodes
 */
async function updateNewEpisodeUrls(episodesPath: string): Promise<void> {
  const logger = createLogger({ verbose: process.env.VERBOSE === 'true' });

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

  logger.section('');
  logger.info(`Loading episodes from: ${episodesPath}`);

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

  logger.summary({
    'Total episodes': episodes.length,
    'Missing Spotify URLs': episodesNeedingSpotify.length,
    'Missing YouTube URLs': episodesNeedingYoutube.length,
    'Missing Apple Podcasts URLs': episodesNeedingApple.length,
    'Missing Amazon Music URLs': episodesNeedingAmazon.length,
  });

  if (
    episodesNeedingSpotify.length === 0 &&
    episodesNeedingYoutube.length === 0 &&
    episodesNeedingApple.length === 0 &&
    episodesNeedingAmazon.length === 0
  ) {
    logger.section('');
    logger.success('All episodes already have URLs!');
    return;
  }

  let totalUpdated = 0;

  // 4. Update Spotify URLs if needed
  if (
    episodesNeedingSpotify.length > 0 &&
    spotifyClientId &&
    spotifyClientSecret
  ) {
    logger.section('\n🎵 Updating Spotify URLs...');
    logger.auth('Authenticating with Spotify...');

    const spotifyAccessToken = await getSpotifyAccessToken(
      spotifyClientId,
      spotifyClientSecret
    );
    logger.success('Successfully authenticated with Spotify');

    logger.info(`Fetching all episodes from Spotify show...`);
    const spotifyEpisodes = await getSpotifyShowEpisodes(
      spotifyShowId,
      spotifyAccessToken
    );
    logger.success(`Found ${spotifyEpisodes.length} episodes in Spotify`);

    let spotifyUpdated = 0;
    for (const episode of episodesNeedingSpotify) {
      logger.processing(episode.title);
      const spotifyUrl = findSpotifyEpisodeByTitle(
        spotifyEpisodes,
        episode.title
      );

      if (spotifyUrl) {
        episode.spotifyUrl = spotifyUrl;
        spotifyUpdated++;
        logger.found(episode.title, spotifyUrl);
      } else {
        logger.notFound(episode.title);
      }
    }

    logger.progress(spotifyUpdated, episodesNeedingSpotify.length, 'Spotify');
    totalUpdated += spotifyUpdated;
  } else if (episodesNeedingSpotify.length > 0) {
    logger.skip('Skipping Spotify URLs (credentials not provided)');
  }

  // 5. Update YouTube URLs if needed
  if (episodesNeedingYoutube.length > 0 && youtubeApiKey) {
    logger.section('\n🎥 Updating YouTube URLs...');
    logger.info(`Fetching all videos from YouTube channel...`);

    const youtubeVideos = await getYouTubeChannelVideos(
      youtubeChannelId,
      youtubeApiKey
    );
    logger.success(`Found ${youtubeVideos.length} videos in YouTube`);

    let youtubeUpdated = 0;
    for (const episode of episodesNeedingYoutube) {
      logger.processing(episode.title);
      const youtubeUrl = findYouTubeVideoByTitle(youtubeVideos, episode.title);

      if (youtubeUrl) {
        episode.youtubeUrl = youtubeUrl;
        youtubeUpdated++;
        logger.found(episode.title, youtubeUrl);
      } else {
        logger.notFound(episode.title);
      }
    }

    logger.progress(youtubeUpdated, episodesNeedingYoutube.length, 'YouTube');
    totalUpdated += youtubeUpdated;
  } else if (episodesNeedingYoutube.length > 0) {
    logger.skip('Skipping YouTube URLs (API key not provided)');
  }

  // 6. Update Apple Podcasts URLs if needed (no auth required!)
  if (episodesNeedingApple.length > 0) {
    logger.section('\n🍎 Updating Apple Podcasts URLs...');
    logger.info(`Fetching all episodes from Apple Podcasts...`);

    const applePodcastEpisodes = await getApplePodcastEpisodes(applePodcastId);
    logger.success(
      `Found ${applePodcastEpisodes.length} episodes in Apple Podcasts`
    );

    let appleUpdated = 0;
    for (const episode of episodesNeedingApple) {
      logger.processing(episode.title);
      const appleUrl = findApplePodcastEpisodeByTitle(
        applePodcastEpisodes,
        episode.title
      );

      if (appleUrl) {
        episode.applePodcastUrl = appleUrl;
        appleUpdated++;
        logger.found(episode.title, appleUrl);
      } else {
        logger.notFound(episode.title);
      }
    }

    logger.progress(
      appleUpdated,
      episodesNeedingApple.length,
      'Apple Podcasts'
    );
    totalUpdated += appleUpdated;
  }

  // 7. Update Amazon Music URLs if needed (requires Puppeteer)
  if (episodesNeedingAmazon.length > 0) {
    logger.section('\n📦 Updating Amazon Music URLs...');
    logger.info('Using browser automation (this may take a minute)...');

    try {
      const amazonEpisodes = await getAmazonMusicEpisodes(
        amazonMusicShowId,
        amazonMusicRegion
      );
      logger.success(`Found ${amazonEpisodes.length} episodes on Amazon Music`);

      let amazonUpdated = 0;
      for (const episode of episodesNeedingAmazon) {
        logger.processing(episode.title);
        const amazonUrl = findAmazonMusicEpisodeByTitle(
          amazonEpisodes,
          episode.title
        );

        if (amazonUrl) {
          episode.amazonMusicUrl = amazonUrl;
          amazonUpdated++;
          logger.found(episode.title, amazonUrl);
        } else {
          logger.notFound(episode.title);
        }
      }

      logger.progress(
        amazonUpdated,
        episodesNeedingAmazon.length,
        'Amazon Music'
      );
      totalUpdated += amazonUpdated;
    } catch (error) {
      logger.section('');
      logger.warning('Error fetching Amazon Music episodes:');
      if (error instanceof Error) {
        logger.list([error.message], 1);
        if (error.message.includes('Puppeteer')) {
          logger.list(['Install with: npm install -D puppeteer'], 1);
        }
      }
      logger.info('Continuing without Amazon Music URLs...');
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
    logger.section('');
    logger.success(`Successfully updated episodes file: ${episodesPath}`);
    logger.info(`Total URLs added: ${totalUpdated}`, 1);
  } else {
    logger.section('');
    logger.warning('No URLs were found for any episodes');
    logger.list(
      [
        'This might mean:',
        '- Episodes are not yet published on the platforms',
        "- Episode titles don't match exactly",
        "- There's an API issue",
      ],
      1
    );
  }

  logger.section('\n✨ Done!');
}

// Main execution
const episodesPath = process.argv[2];

if (!episodesPath) {
  const logger = createLogger();
  logger.error('Error: Episodes file path is required');
  logger.section('\nUsage:');
  logger.list(['npm run update-new-episode-urls <episodes-file-path>'], 1);
  logger.section('\nExample:');
  logger.list(
    ['npm run update-new-episode-urls public/rss/20251015-1451-episodes.json'],
    1
  );
  logger.section('\nEnvironment Variables (for Spotify & YouTube):');
  logger.list(
    [
      'SPOTIFY_CLIENT_ID=your_client_id (optional, for Spotify URLs)',
      'SPOTIFY_CLIENT_SECRET=your_client_secret (optional, for Spotify URLs)',
      'YOUTUBE_API_KEY=your_api_key (optional, for YouTube URLs)',
    ],
    1
  );
  logger.section('\nOptional Environment Variables:');
  logger.list(
    [
      'SPOTIFY_SHOW_ID=your_show_id (defaults to hardcoded value)',
      'YOUTUBE_CHANNEL_ID=your_channel_id (defaults to @kaigaicareerlog)',
      'APPLE_PODCAST_ID=your_podcast_id (defaults to 1818019572)',
      'AMAZON_MUSIC_SHOW_ID=your_show_id (defaults to 118b5e6b-1f97-4c62-97a5-754714381b40)',
      "AMAZON_MUSIC_REGION=region (defaults to 'co.jp')",
      'VERBOSE=true (enable verbose logging with URLs)',
    ],
    1
  );
  logger.section('\nNote:');
  logger.list(
    [
      'Apple Podcasts uses iTunes API (free, no auth required!)',
      'Amazon Music uses browser automation (requires Puppeteer).',
      'At least Apple Podcasts URLs will be found even without any credentials.',
    ],
    1
  );
  process.exit(1);
}

updateNewEpisodeUrls(episodesPath).catch((error) => {
  const logger = createLogger();
  logger.section('');
  logger.error(`Error: ${error.message}`);
  process.exit(1);
});
