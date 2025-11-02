import type { SpotifyAuthResponse } from '../../types';

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

