import 'dotenv/config';

const DEFAULT_SHOW_ID = '0bj38cgbe71oCr5Q0emwvA';

export function getSpotifyConfidentials(): {
  clientId: string;
  clientSecret: string;
  showId: string;
} {
  // 1. Get environment variables
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const showId = process.env.SPOTIFY_SHOW_ID || DEFAULT_SHOW_ID;

  if (!clientId) {
    throw new Error('SPOTIFY_CLIENT_ID environment variable is required');
  }

  if (!clientSecret) {
    throw new Error('SPOTIFY_CLIENT_SECRET environment variable is required');
  }

  return {
    clientId,
    clientSecret,
    showId,
  };
}
