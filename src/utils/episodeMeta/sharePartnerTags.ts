import { MAX_TAGS_PER_KIND } from '../../constants/episodeVocabulary';
import type { EpisodeMeta, EpisodeMetaMap, PodcastEpisode } from '../../types';
import { getEpisodePartner } from './getEpisodePartner';

const RETURNEE_SLUG = 'return-to-japan';

/**
 * The guest of a two-part interview is the same person in both halves, so
 * where they live and whether they came back to Japan applies to both. The
 * tagger only sees one half at a time and often finds nothing in the half
 * that doesn't mention it.
 */
function shareInto(target: EpisodeMeta, source: EpisodeMeta): EpisodeMeta {
  const next = { ...target };

  // City and country only fill a gap; they never replace what was tagged
  if (next.cities.length === 0) next.cities = [...source.cities];
  if (next.countries.length === 0) next.countries = [...source.countries];

  if (
    source.topics.includes(RETURNEE_SLUG) &&
    !next.topics.includes(RETURNEE_SLUG)
  ) {
    const limit = MAX_TAGS_PER_KIND.topic;
    // When the topics are full, the returnee tag takes the last place
    next.topics = [...next.topics.slice(0, limit - 1), RETURNEE_SLUG];
  }
  return next;
}

const isSame = (a: EpisodeMeta, b: EpisodeMeta) =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * Copies city, country and the 日本に帰国した人 tag between the two halves of a
 * two-part interview. Entries a human has reviewed are left as they are.
 *
 * @param episodes All episodes, newest first
 * @returns A new map, and the GUIDs of the episodes that changed
 */
export function sharePartnerTags(
  episodes: readonly PodcastEpisode[],
  map: EpisodeMetaMap
): { map: EpisodeMetaMap; changed: string[] } {
  const result: EpisodeMetaMap = { ...map };
  const changed: string[] = [];

  for (const episode of episodes) {
    const own = map[episode.guid];
    if (!own || own.reviewed) continue;

    const partner = getEpisodePartner(episode, episodes, map);
    const partnerMeta = partner && map[partner.episode.guid];
    if (!partnerMeta) continue;

    const updated = shareInto(own, partnerMeta);
    if (!isSame(own, updated)) {
      result[episode.guid] = updated;
      changed.push(episode.guid);
    }
  }
  return { map: result, changed };
}
