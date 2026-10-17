import type { TagKind } from '../../constants/episodeVocabulary';
import type { EpisodeMeta } from '../../types';
import { findTagBySlug } from './resolveTag';

export type EpisodePillKind = 'position' | 'company' | 'place' | 'topic';

export interface EpisodePill {
  kind: EpisodePillKind;
  label: string;
  /** Tag slug, for place and topic pills (these can link to a tag page) */
  slug?: string;
}

/** 'card' is compact (one pill per kind); 'page' shows everything + topics */
export type EpisodePillVariant = 'card' | 'page';

function unique(values: Array<string | null>): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

interface TagRef {
  slug: string;
  label: string;
}

function tagRefs(kind: TagKind, slugs: string[]): TagRef[] {
  return slugs.flatMap((slug) => {
    const tag = findTagBySlug(kind, slug);
    return tag ? [{ slug, label: tag.label }] : [];
  });
}

/**
 * Turns episode metadata into the pills shown on the episode card and page.
 * Order: position, company, city, country (then topics on the page).
 * The guest's name is intentionally never a pill.
 */
export function getEpisodePills(
  meta: EpisodeMeta | undefined,
  variant: EpisodePillVariant
): EpisodePill[] {
  if (!meta) return [];

  const positions = unique(meta.guests.map((guest) => guest.position));
  const companies = unique(meta.guests.map((guest) => guest.company));
  const cities = tagRefs('city', meta.cities);
  const countries = tagRefs('country', meta.countries);

  const textPills = (kind: EpisodePillKind, labels: string[]): EpisodePill[] =>
    labels.map((label) => ({ kind, label }));
  const tagPills = (kind: EpisodePillKind, tags: TagRef[]): EpisodePill[] =>
    tags.map(({ slug, label }) => ({ kind, label, slug }));

  if (variant === 'card') {
    return [
      ...textPills('position', positions.slice(0, 1)),
      ...textPills('company', companies.slice(0, 1)),
      ...tagPills('place', cities.slice(0, 1)),
      ...tagPills('place', countries.slice(0, 1)),
    ];
  }

  return [
    ...textPills('position', positions),
    ...textPills('company', companies),
    ...tagPills('place', cities),
    ...tagPills('place', countries),
    ...tagPills('topic', tagRefs('topic', meta.topics)),
  ];
}
