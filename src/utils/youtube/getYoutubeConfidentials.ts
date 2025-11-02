import 'dotenv/config';

const DEFAULT_YOUTUBE_CHANNEL_ID = '@kaigaicareerlog';

export function getYoutubeConfidentials(): {
  apiKey: string;
  channelId: string;
} {
  const apiKey = process.env.YOUTUBE_API_KEY || '';
  const channelId =
    process.env.YOUTUBE_CHANNEL_ID || DEFAULT_YOUTUBE_CHANNEL_ID;

  return {
    apiKey,
    channelId,
  };
}
