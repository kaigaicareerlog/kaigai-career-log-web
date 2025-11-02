import 'dotenv/config';

export function getXConfidentials(): {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
} {
  // Get API credentials from environment
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;

  if (!accessToken) {
    throw new Error('X_ACCESS_TOKEN environment variable is required');
  }
  if (!accessTokenSecret) {
    throw new Error('X_ACCESS_TOKEN_SECRET environment variable is required');
  }
  if (!apiKey) {
    throw new Error('X_API_KEY environment variable is required');
  }
  if (!apiSecret) {
    throw new Error('X_API_SECRET environment variable is required');
  }

  return {
    apiKey,
    apiSecret,
    accessToken,
    accessTokenSecret,
  };
}
