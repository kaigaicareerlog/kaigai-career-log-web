import type { PodcastEpisode } from '../types';
import { findLatestEpisodes } from './findLatestEpisodes';

/**
 * 最新の、公開してよい episodes.json を読む。
 * 空・壊れている・話数が急減した新しいファイルは飛ばす。
 */
export async function getLatestEpisodes(): Promise<{
  episodes: PodcastEpisode[];
}> {
  try {
    return { episodes: findLatestEpisodes() };
  } catch (error) {
    console.error('Error parsing JSON feed:', error);
    throw error;
  }
}
