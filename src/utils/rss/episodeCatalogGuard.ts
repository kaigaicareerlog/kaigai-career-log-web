/**
 * Decides whether a newly parsed episode catalog is safe to publish.
 *
 * The daily RSS job has not been observed failing in the checked snapshot
 * (82 feed items, 82 episodes). These checks are a guard for that risk:
 * an empty file, a file that is not a catalog, or a sudden shrink must not
 * replace the catalog the site already has.
 *
 * Drop rule, applied only when the previous catalog has at least
 * {@link MIN_CATALOG_SIZE_FOR_DROP_GUARD} episodes: the new catalog must
 * keep at least {@link MIN_RETAINED_EPISODE_RATIO} of that count, both as
 * a raw length and as GUIDs that still appear. At 82 episodes the minimum
 * is 73.8, so 74 or more previous episodes may remain and 73 or fewer is
 * refused. Growth, and a shrink of a catalog smaller than 5, is allowed.
 */

export const MIN_CATALOG_SIZE_FOR_DROP_GUARD = 5;
export const MIN_RETAINED_EPISODE_RATIO = 0.9;

export interface CatalogEpisode {
  guid?: string;
  title?: string;
}

export interface CatalogCandidate<T> {
  id: string;
  /** Null when the file is missing, unreadable, or not an episode array. */
  episodes: T[] | null;
}

/**
 * @returns A reason to refuse the catalog, or null when it is safe to use.
 */
export function catalogRejectionReason(
  episodes: CatalogEpisode[] | null | undefined,
  existingGuids: readonly string[]
): string | null {
  if (!episodes || episodes.length === 0) {
    return 'catalog is empty';
  }

  const missingIdentity = episodes.filter(
    (episode) => !episode.guid?.trim() || !episode.title?.trim()
  );
  if (missingIdentity.length > 0) {
    return `${missingIdentity.length} episode(s) are missing a guid or title`;
  }

  const guids = episodes.map((episode) => episode.guid!.trim());
  if (new Set(guids).size !== guids.length) {
    return 'catalog contains duplicate guids';
  }

  const existing = existingGuids.map((guid) => guid.trim()).filter(Boolean);
  if (existing.length < MIN_CATALOG_SIZE_FOR_DROP_GUARD) return null;

  const minimum = existing.length * MIN_RETAINED_EPISODE_RATIO;
  if (episodes.length < minimum) {
    return `episode count fell from ${existing.length} to ${episodes.length} (minimum ${minimum})`;
  }

  const existingSet = new Set(existing);
  const retained = guids.filter((guid) => existingSet.has(guid)).length;
  if (retained < minimum) {
    return `only ${retained} of ${existing.length} existing episodes were retained (minimum ${minimum})`;
  }

  return null;
}

/**
 * Picks the newest catalog that is valid against the catalog that would
 * have been published before it. Candidates are ordered newest first.
 * A newer empty, broken, or sharply smaller file is skipped, including
 * when a small broken file sits between it and the last good catalog.
 */
export function chooseEpisodeCatalog<T extends CatalogEpisode>(
  newestFirst: readonly CatalogCandidate<T>[]
): CatalogCandidate<T> | null {
  return chooseFrom(newestFirst);
}

function chooseFrom<T extends CatalogEpisode>(
  newestFirst: readonly CatalogCandidate<T>[]
): CatalogCandidate<T> | null {
  const [head, ...older] = newestFirst;
  if (!head) return null;

  const previous = chooseFrom(older);
  if (!head.episodes || catalogRejectionReason(head.episodes, []) !== null) {
    return previous;
  }
  if (!previous?.episodes) return head;

  const existingGuids = previous.episodes.map((episode) => episode.guid ?? '');
  if (catalogRejectionReason(head.episodes, existingGuids) === null) {
    return head;
  }
  return previous;
}
