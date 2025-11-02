import 'dotenv/config';

const DEFAULT_AMAZON_MUSIC_SHOW_ID = '118b5e6b-1f97-4c62-97a5-754714381b40';
const DEFAULT_AMAZON_MUSIC_REGION = 'co.jp';

export function getAmazonMusicConfidentials(): {
  showId: string;
  region: string;
} {
  return {
    showId: process.env.AMAZON_MUSIC_SHOW_ID || DEFAULT_AMAZON_MUSIC_SHOW_ID,
    region: process.env.AMAZON_MUSIC_REGION || DEFAULT_AMAZON_MUSIC_REGION,
  };
}
