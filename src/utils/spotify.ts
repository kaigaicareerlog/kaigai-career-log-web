/**
 * Utility functions for Spotify integration
 */
import type {
  SpotifyAuthResponse,
  SpotifyEpisode,
  SpotifyShowEpisodesResponse,
} from '../types';

/**
 * Extracts Spotify episode ID from a Spotify URL and returns the embed URL
 * @param url - Spotify episode URL (e.g., https://open.spotify.com/episode/1pCYF2Hh9auRtTCELuPK8e)
 * @returns Spotify embed URL or null if URL is invalid
 */
export function getSpotifyEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;

  const match = url.match(/episode\/([a-zA-Z0-9]+)/);
  if (match && match[1]) {
    return `https://open.spotify.com/embed/episode/${match[1]}`;
  }

  return null;
}

/**
 * Checks if a given URL is a valid Spotify episode URL
 * @param url - URL to validate
 * @returns true if the URL is a valid Spotify episode URL
 */
export function isValidSpotifyEpisodeUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /^https:\/\/open\.spotify\.com\/episode\/[a-zA-Z0-9]+/.test(url);
}

/**
 * Get Spotify access token using Client Credentials flow
 */
export async function getSpotifyAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get Spotify access token: ${response.statusText}`
    );
  }

  const data: SpotifyAuthResponse = await response.json();
  return data.access_token;
}

/**
 * Get all episodes from a Spotify show
 */
export async function getSpotifyShowEpisodes(
  showId: string,
  accessToken: string
): Promise<SpotifyEpisode[]> {
  const episodes: SpotifyEpisode[] = [];
  let nextUrl: string | null =
    `https://api.spotify.com/v1/shows/${showId}/episodes?limit=50`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Spotify episodes: ${response.statusText}`
      );
    }

    const data: SpotifyShowEpisodesResponse = await response.json();
    episodes.push(...data.items);
    nextUrl = data.next;
  }

  return episodes;
}

/**
 * Find Spotify episode URL by matching title
 */
export function findSpotifyEpisodeByTitle(
  episodes: SpotifyEpisode[],
  title: string
): string | null {
  // Filter out any null/undefined episodes and episodes without names
  const validEpisodes = episodes.filter((ep) => ep && ep.name);

  // Try exact match first
  const exactMatch = validEpisodes.find((ep) => ep.name === title);
  if (exactMatch) {
    return exactMatch.external_urls.spotify;
  }

  // Try normalized match (remove extra spaces, normalize characters)
  const normalizedTitle = title.trim().replace(/\s+/g, ' ');
  const normalizedMatch = validEpisodes.find(
    (ep) => ep.name.trim().replace(/\s+/g, ' ') === normalizedTitle
  );
  if (normalizedMatch) {
    return normalizedMatch.external_urls.spotify;
  }

  // Try partial match (title contains the search term or vice versa)
  const partialMatch = validEpisodes.find(
    (ep) => ep.name.includes(title) || title.includes(ep.name)
  );
  if (partialMatch) {
    return partialMatch.external_urls.spotify;
  }

  return null;
}
