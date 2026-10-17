import { MIN_EPISODES_FOR_TAG_PAGE } from '../../constants/tagPages';
import {
  TAG_DEFINITIONS,
  type TagKind,
} from '../../constants/episodeVocabulary';
import type { EpisodeMeta, EpisodeMetaMap, PodcastEpisode } from '../../types';

export interface TagPage {
  kind: TagKind;
  slug: string;
  label: string;
  /** Episodes carrying the tag, newest first */
  episodes: PodcastEpisode[];
}

/** Order the kinds appear in on the topics index */
export const TAG_KIND_ORDER: readonly TagKind[] = [
  'country',
  'city',
  'role',
  'topic',
];

const META_FIELD: Record<TagKind, keyof EpisodeMeta> = {
  role: 'roles',
  country: 'countries',
  city: 'cities',
  topic: 'topics',
};

/**
 * Every tag that has enough episodes for its own page, grouped by kind (in
 * TAG_KIND_ORDER) and most episodes first within a kind.
 *
 * @param episodes All episodes, newest first
 */
export function getTagPages(
  episodes: readonly PodcastEpisode[],
  map: EpisodeMetaMap,
  minEpisodes: number = MIN_EPISODES_FOR_TAG_PAGE
): TagPage[] {
  return TAG_KIND_ORDER.flatMap((kind) =>
    TAG_DEFINITIONS[kind]
      .map((tag) => ({
        kind,
        slug: tag.slug,
        label: tag.label,
        episodes: episodes.filter((episode) =>
          (
            map[episode.guid]?.[META_FIELD[kind]] as string[] | undefined
          )?.includes(tag.slug)
        ),
      }))
      .filter((page) => page.episodes.length >= minEpisodes)
      .sort((a, b) => b.episodes.length - a.episodes.length)
  );
}

/** URL path of a tag's page */
export function getTagPagePath(slug: string): string {
  return `/tags/${slug}/`;
}
