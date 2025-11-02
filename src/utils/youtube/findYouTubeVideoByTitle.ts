import type { YouTubeVideo } from './types';

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

