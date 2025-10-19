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

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  url: string;
}

/**
 * Extract channel ID from YouTube channel URL
 * Supports formats:
 * - https://www.youtube.com/@username
 * - https://www.youtube.com/channel/UCxxxxx
 * - https://www.youtube.com/c/channelname
 */
export function extractChannelIdFromUrl(url: string): string | null {
  // Handle @username format - needs to be resolved via API
  const usernameMatch = url.match(/@([^/?]+)/);
  if (usernameMatch) {
    return `@${usernameMatch[1]}`;
  }

  // Handle channel ID format
  const channelMatch = url.match(/channel\/([^/?]+)/);
  if (channelMatch) {
    return channelMatch[1];
  }

  // Handle custom URL format
  const customMatch = url.match(/\/c\/([^/?]+)/);
  if (customMatch) {
    return customMatch[1];
  }

  return null;
}

/**
 * Get channel ID from handle (e.g., @username)
 */
export async function getChannelIdFromHandle(
  handle: string,
  apiKey: string
): Promise<string> {
  // Remove @ if present
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;

  const url = new URL('https://www.googleapis.com/youtube/v3/channels');
  url.searchParams.append('part', 'id');
  url.searchParams.append('forHandle', cleanHandle);
  url.searchParams.append('key', apiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error(`Channel not found for handle: @${cleanHandle}`);
  }

  return data.items[0].id;
}

/**
 * Fetch all videos from a YouTube channel
 */
export async function getYouTubeChannelVideos(
  channelId: string,
  apiKey: string
): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = [];
  let nextPageToken: string | undefined;

  // If channelId starts with @, resolve it first
  let resolvedChannelId = channelId;
  if (channelId.startsWith('@')) {
    resolvedChannelId = await getChannelIdFromHandle(channelId, apiKey);
  }

  do {
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('channelId', resolvedChannelId);
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('order', 'date');
    searchUrl.searchParams.append('maxResults', '50');
    searchUrl.searchParams.append('key', apiKey);

    if (nextPageToken) {
      searchUrl.searchParams.append('pageToken', nextPageToken);
    }

    const response = await fetch(searchUrl.toString());

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.items) {
      for (const item of data.items) {
        videos.push({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        });
      }
    }

    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return videos;
}

/**
 * Find YouTube video URL by matching title
 * Uses the same fuzzy matching logic as Spotify
 */
export function findYouTubeVideoByTitle(
  videos: YouTubeVideo[],
  title: string
): string | null {
  // Filter out any null/undefined videos
  const validVideos = videos.filter((video) => video && video.title);

  // Try exact match first
  const exactMatch = validVideos.find((video) => video.title === title);
  if (exactMatch) {
    return exactMatch.url;
  }

  // Try normalized match (remove extra spaces, normalize characters)
  const normalizedTitle = title.trim().replace(/\s+/g, ' ');
  const normalizedMatch = validVideos.find(
    (video) => video.title.trim().replace(/\s+/g, ' ') === normalizedTitle
  );
  if (normalizedMatch) {
    return normalizedMatch.url;
  }

  // Try partial match (title contains the search term or vice versa)
  const partialMatch = validVideos.find(
    (video) => video.title.includes(title) || title.includes(video.title)
  );
  if (partialMatch) {
    return partialMatch.url;
  }

  return null;
}
