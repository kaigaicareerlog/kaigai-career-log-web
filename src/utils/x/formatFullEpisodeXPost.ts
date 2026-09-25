import type { PodcastEpisode } from '../../types';
import { formatNewEpisodeMainTweet } from './formatNewEpisodeMainTweet';
import { formatNewEpisodeUrlsTweet } from './formatNewEpisodeUrlsTweet';

/**
 * Combines the announcement and the platform links into a single post, so it
 * can be copied from one place instead of two separate tweets. Used when
 * posting manually (see scripts/notify-episode-to-post-x.ts) rather than as
 * an automatic thread, where the two were kept separate to fit X's per-tweet
 * character limit.
 */
export function formatFullEpisodeXPost(
  episode: PodcastEpisode,
  hosts: string
): string {
  const main = formatNewEpisodeMainTweet(episode, hosts);
  const urls = formatNewEpisodeUrlsTweet(episode);
  return urls ? `${main}\n\n${urls}` : main;
}
