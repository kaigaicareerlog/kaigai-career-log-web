import type { PodcastEpisode } from '../../types';

export interface UrlUpdateRequest {
  spotify: boolean;
  youtube: boolean;
  apple: boolean;
  amazon: boolean;
  /** When set, only this episode is considered. */
  guid?: string;
}

type EpisodeUrlFields = Pick<
  PodcastEpisode,
  'guid' | 'spotifyUrl' | 'youtubeUrl' | 'applePodcastUrl' | 'amazonMusicUrl'
>;

export interface EpisodesNeedingUrls<T> {
  spotify: T[];
  youtube: T[];
  apple: T[];
  amazon: T[];
}

/**
 * Reads the manual URL-update switches. An unset variable means "update",
 * which is how the daily RSS job calls the same script. Only the string
 * "false" turns a platform off.
 */
export function readUrlUpdateRequest(
  env: Record<string, string | undefined>
): UrlUpdateRequest {
  return {
    spotify: env.UPDATE_SPOTIFY !== 'false',
    youtube: env.UPDATE_YOUTUBE !== 'false',
    apple: env.UPDATE_APPLE !== 'false',
    amazon: env.UPDATE_AMAZON !== 'false',
    guid: env.EPISODE_GUID?.trim() || undefined,
  };
}

function missing(url: string | undefined): boolean {
  return !url;
}

/**
 * Episodes whose platform URL is still empty, after the optional GUID and
 * platform switches. Existing non-empty URLs are left untouched.
 */
export function selectEpisodesNeedingUrls<T extends EpisodeUrlFields>(
  episodes: readonly T[],
  request: UrlUpdateRequest
): EpisodesNeedingUrls<T> {
  const scoped = request.guid
    ? episodes.filter((episode) => episode.guid === request.guid)
    : episodes;

  return {
    spotify: request.spotify
      ? scoped.filter((episode) => missing(episode.spotifyUrl))
      : [],
    youtube: request.youtube
      ? scoped.filter((episode) => missing(episode.youtubeUrl))
      : [],
    apple: request.apple
      ? scoped.filter((episode) => missing(episode.applePodcastUrl))
      : [],
    amazon: request.amazon
      ? scoped.filter((episode) => missing(episode.amazonMusicUrl))
      : [],
  };
}
