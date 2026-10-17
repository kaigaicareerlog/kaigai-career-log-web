import type { EpisodeMetaMap, PodcastEpisode } from '../../types';
import { isSpecialEpisode } from '../isSpecialEpisode';
import { normalizeSearchText } from './searchText';

export interface EpisodePartner {
  episode: PodcastEpisode;
  /** Which half the partner is: '前半' (first half) or '後半' (second half) */
  label: '前半' | '後半';
}

const FIRST_HALF = /[（(]前半[）)]/;
const SECOND_HALF = /[（(]後半[）)]/;

// Special episodes (【特別回】, 【対談】) are sometimes published between the
// two parts of a regular episode, and the other way round
const MAX_SKIPPED = 3;

const isPart = (title: string) =>
  FIRST_HALF.test(title) || SECOND_HALF.test(title);

/**
 * The nearest episode in the given direction that is one half of a
 * two-part episode of the same kind (special or regular), skipping a few
 * episodes in between.
 */
function findNeighbourPart(
  episodes: readonly PodcastEpisode[],
  from: number,
  step: 1 | -1
): PodcastEpisode | undefined {
  const special = isSpecialEpisode(episodes[from].title);
  for (let n = 1; n <= MAX_SKIPPED + 1; n++) {
    const candidate = episodes[from + step * n];
    if (!candidate) return undefined;
    if (
      isPart(candidate.title) &&
      isSpecialEpisode(candidate.title) === special
    ) {
      return candidate;
    }
  }
  return undefined;
}

function guestName(map: EpisodeMetaMap, guid: string): string | null {
  const name = map[guid]?.guests[0]?.name;
  return name ? normalizeSearchText(name) : null;
}

const isLatin = (name: string) => /^[\x20-\x7e]+$/.test(name);

/**
 * Whether two guest names could be the same person. The same person is
 * often written in Latin letters in one part and in Japanese in the other
 * (Kei / ケイ), which can't be compared, so only names in the same script
 * that differ count as a mismatch.
 */
function namesCompatible(a: string | null, b: string | null): boolean {
  if (!a || !b || a === b) return true;
  return isLatin(a) !== isLatin(b);
}

/**
 * Finds the other half of a two-part episode. A 後半 pairs with the nearest
 * earlier episode that is part of a series if that one is a 前半 (and the
 * other way round), skipping over special episodes published in between.
 * When both episodes name a guest, the names must be compatible; a wrong
 * link is worse than a missing one.
 *
 * @param episodes All episodes, newest first
 */
export function getEpisodePartner(
  episode: PodcastEpisode,
  episodes: readonly PodcastEpisode[],
  map: EpisodeMetaMap
): EpisodePartner | null {
  const index = episodes.findIndex((e) => e.guid === episode.guid);
  if (index === -1) return null;

  let candidate: PodcastEpisode | undefined;
  let label: EpisodePartner['label'];

  if (SECOND_HALF.test(episode.title)) {
    candidate = findNeighbourPart(episodes, index, 1); // published earlier
    label = '前半';
    if (!candidate || !FIRST_HALF.test(candidate.title)) return null;
  } else if (FIRST_HALF.test(episode.title)) {
    candidate = findNeighbourPart(episodes, index, -1); // published later
    label = '後半';
    if (!candidate || !SECOND_HALF.test(candidate.title)) return null;
  } else {
    return null;
  }

  const a = guestName(map, episode.guid);
  const b = guestName(map, candidate.guid);
  if (!namesCompatible(a, b)) return null;

  return { episode: candidate, label };
}
