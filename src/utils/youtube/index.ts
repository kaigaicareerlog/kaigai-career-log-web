/**
 * YouTube Data API v3 utilities for fetching episode URLs
 *
 * Setup:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select an existing one
 * 3. Enable YouTube Data API v3
 * 4. Create credentials (API Key)
 * 5. Set YOUTUBE_API_KEY in your environment variables
 *
 * Required environment variables:
 * - YOUTUBE_API_KEY: Your YouTube Data API v3 key
 * - YOUTUBE_CHANNEL_ID: Your YouTube channel ID (optional, can extract from URL)
 */
export { extractChannelIdFromUrl } from './extractChannelIdFromUrl';
export { getChannelIdFromHandle } from './getChannelIdFromHandle';
export { getYouTubeChannelVideos } from './getYouTubeChannelVideos';
export { findYouTubeVideoByTitle } from './findYouTubeVideoByTitle';
export { getYoutubeConfidentials } from './getYoutubeConfidentials';
export type { YouTubeVideo } from './types';

