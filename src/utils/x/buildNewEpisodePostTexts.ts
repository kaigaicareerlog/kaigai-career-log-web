import { EPISODE_GUID_PATTERN, X_POST_HOSTS } from '../../constants/xPost';
import { SITE_URL } from '../../constants/site';
import type { PodcastEpisode } from '../../types';
import { formatNewEpisodeMainTweet } from './formatNewEpisodeMainTweet';
import { formatNewEpisodeUrlsTweet } from './formatNewEpisodeUrlsTweet';

export interface NewEpisodePostTexts {
  mainText: string;
  replyText: string;
  episodePageUrl: string;
  shareImageUrl: string;
}

/**
 * Renders the main post and the reply from the current episode record.
 * Approval publishes a tweet only when the issue text still equals this render.
 */
export function buildNewEpisodePostTexts(
  episode: PodcastEpisode
): NewEpisodePostTexts {
  if (!EPISODE_GUID_PATTERN.test(episode.guid)) {
    throw new Error('Episode guid is not a UUID');
  }
  const episodePageUrl = `${SITE_URL}/episodes/${episode.guid}/`;
  return {
    mainText: formatNewEpisodeMainTweet(episode, X_POST_HOSTS),
    replyText: formatNewEpisodeUrlsTweet(episode, episodePageUrl),
    episodePageUrl,
    shareImageUrl: `${SITE_URL}/og/episodes/${episode.guid}.png`,
  };
}
