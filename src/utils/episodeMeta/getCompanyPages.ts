import type { EpisodeMetaMap, PodcastEpisode } from '../../types';

/** A company needs this many episodes for its own page (one interview's two halves count) */
export const MIN_EPISODES_FOR_COMPANY_PAGE = 2;

// Slugs for names that have no Latin letters to build one from
const SLUG_OVERRIDES: Record<string, string> = {
  楽天: 'rakuten',
};

export interface CompanyGuest {
  name: string | null;
  position: string | null;
}

export interface CompanyEntry {
  slug: string;
  /** Company name as tagged */
  name: string;
  /** Episodes with a guest from the company, newest first */
  episodes: PodcastEpisode[];
  /** The guests from the company, each once */
  guests: CompanyGuest[];
}

/** URL-safe slug for a company name, or null if one can't be made */
export function getCompanySlug(name: string): string | null {
  const trimmed = name.trim();
  if (SLUG_OVERRIDES[trimmed]) return SLUG_OVERRIDES[trimmed];
  const slug = trimmed
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || null;
}

/** URL path of a company's page */
export function getCompanyPagePath(slug: string): string {
  return `/companies/${slug}/`;
}

/**
 * Every company a tagged guest works (or worked) at, most episodes first.
 * Names that differ only in case or spacing are treated as one company.
 *
 * @param episodes All episodes, newest first
 */
export function getCompanies(
  episodes: readonly PodcastEpisode[],
  map: EpisodeMetaMap
): CompanyEntry[] {
  const bySlug = new Map<string, CompanyEntry>();

  for (const episode of episodes) {
    for (const guest of map[episode.guid]?.guests ?? []) {
      if (!guest.company) continue;
      const slug = getCompanySlug(guest.company);
      if (!slug) continue;

      const entry = bySlug.get(slug) ?? {
        slug,
        name: guest.company.trim(),
        episodes: [],
        guests: [],
      };
      if (!entry.episodes.includes(episode)) entry.episodes.push(episode);
      if (!entry.guests.some((g) => g.name === guest.name)) {
        entry.guests.push({ name: guest.name, position: guest.position });
      }
      bySlug.set(slug, entry);
    }
  }

  return [...bySlug.values()].sort(
    (a, b) =>
      b.episodes.length - a.episodes.length || a.name.localeCompare(b.name)
  );
}

/** Companies with enough episodes for their own page */
export function getCompanyPages(
  episodes: readonly PodcastEpisode[],
  map: EpisodeMetaMap,
  minEpisodes: number = MIN_EPISODES_FOR_COMPANY_PAGE
): CompanyEntry[] {
  return getCompanies(episodes, map).filter(
    (company) => company.episodes.length >= minEpisodes
  );
}
