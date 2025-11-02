import type {
  SpotifyEpisode,
  SpotifyShowEpisodesResponse,
} from '../../types';

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

