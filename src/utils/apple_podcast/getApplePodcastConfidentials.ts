import 'dotenv/config';

const DEFAULT_APPLE_PODCAST_ID = '1818019572';

export function getApplePodcastConfidentials(): {
  podcastId: string;
} {
  return {
    podcastId: process.env.APPLE_PODCAST_ID || DEFAULT_APPLE_PODCAST_ID,
  };
}
