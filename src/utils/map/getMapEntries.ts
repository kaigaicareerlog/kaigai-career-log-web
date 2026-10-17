import { MIN_EPISODES_FOR_TAG_PAGE } from '../../constants/tagPages';
import { TAG_DEFINITIONS } from '../../constants/episodeVocabulary';
import type { EpisodeMetaMap, PodcastEpisode } from '../../types';
import { getTagPagePath, getTagPages } from '../episodeMeta/getTagPages';

/** Tokyo is where the 日本に帰国した人 episodes go on the map */
export const RETURNEE_PIN = {
  id: 'tokyo',
  label: '日本に帰国',
  tagSlug: 'return-to-japan',
  lat: 35.6762,
  lon: 139.6503,
} as const;

export interface MapEntry {
  id: string;
  label: string;
  kind: 'city' | 'returnee';
  lat: number;
  lon: number;
  /** Number of episodes */
  count: number;
  /** The latest few episodes, newest first */
  episodes: PodcastEpisode[];
  /** The tag page, when the tag has enough episodes to have one */
  pagePath: string | null;
}

const LATEST_EPISODES = 3;

/**
 * One pin per city that has at least one episode (its position comes from the
 * city's entry in the vocabulary), plus a Tokyo pin for the guests who
 * returned to Japan. Most episodes first.
 *
 * @param episodes All episodes, newest first
 */
export function getMapEntries(
  episodes: readonly PodcastEpisode[],
  map: EpisodeMetaMap
): MapEntry[] {
  const pages = getTagPages(episodes, map, 1);
  const pagePathFor = (count: number, slug: string) =>
    count >= MIN_EPISODES_FOR_TAG_PAGE ? getTagPagePath(slug) : null;

  const cities = pages
    .filter((page) => page.kind === 'city')
    .flatMap((page): MapEntry[] => {
      const definition = TAG_DEFINITIONS.city.find((c) => c.slug === page.slug);
      if (definition?.lat === undefined || definition.lon === undefined) {
        return [];
      }
      return [
        {
          id: page.slug,
          label: page.label,
          kind: 'city',
          lat: definition.lat,
          lon: definition.lon,
          count: page.episodes.length,
          episodes: page.episodes.slice(0, LATEST_EPISODES),
          pagePath: pagePathFor(page.episodes.length, page.slug),
        },
      ];
    });

  const returnees = pages.find(
    (page) => page.kind === 'topic' && page.slug === RETURNEE_PIN.tagSlug
  );
  const returneeEntry: MapEntry[] = returnees
    ? [
        {
          id: RETURNEE_PIN.id,
          label: RETURNEE_PIN.label,
          kind: 'returnee',
          lat: RETURNEE_PIN.lat,
          lon: RETURNEE_PIN.lon,
          count: returnees.episodes.length,
          episodes: returnees.episodes.slice(0, LATEST_EPISODES),
          pagePath: pagePathFor(returnees.episodes.length, returnees.slug),
        },
      ]
    : [];

  return [...cities, ...returneeEntry].sort((a, b) => b.count - a.count);
}
