import type { YouTubeVideo } from './types';
import { getChannelIdFromHandle } from './getChannelIdFromHandle';

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

