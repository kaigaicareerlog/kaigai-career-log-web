/**
 * iTunes Search API types for Apple Podcasts
 */

export interface ApplePodcastEpisode {
  trackId: number;
  trackName: string;
  description: string;
  releaseDate: string;
  trackViewUrl: string;
  collectionId: number;
  collectionName: string;
}
