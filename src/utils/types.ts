/**
 * ポッドキャストエピソードの型定義
 */
export interface PodcastEpisode {
  title: string;
  description: string;
  duration: string;
  date: string;
  link: string;
  audioUrl: string;
  guid: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  applePodcastUrl?: string;
  amazonMusicUrl?: string;
}

/**
 * RSSチャンネルの型定義
 */
export interface RSSChannel {
  title: string;
  description: string;
  link: string;
  language: string;
  image: string;
  episodes: PodcastEpisode[];
}
