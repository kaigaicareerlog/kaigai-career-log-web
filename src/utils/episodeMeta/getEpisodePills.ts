import type { TagKind } from '../../constants/episodeVocabulary';
import type { EpisodeMeta } from '../../types';
import { findTagBySlug } from './resolveTag';

export type EpisodePillKind = 'position' | 'company' | 'place' | 'topic';

export interface EpisodePill {
  kind: EpisodePillKind;
  label: string;
}

/** 'card' is compact (one pill per kind); 'page' shows everything + topics */
export type EpisodePillVariant = 'card' | 'page';

function unique(values: Array<string | null>): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

function tagLabels(kind: TagKind, slugs: string[]): string[] {
  return slugs
    .map((slug) => findTagBySlug(kind, slug)?.label)
    .filter((label): label is string => Boolean(label));
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
  const cities = tagLabels('city', meta.cities);
  const countries = tagLabels('country', meta.countries);

  const toPills = (kind: EpisodePillKind, labels: string[]): EpisodePill[] =>
    labels.map((label) => ({ kind, label }));

  if (variant === 'card') {
    return [
      ...toPills('position', positions.slice(0, 1)),
      ...toPills('company', companies.slice(0, 1)),
      ...toPills('place', cities.slice(0, 1)),
      ...toPills('place', countries.slice(0, 1)),
    ];
  }

  return [
    ...toPills('position', positions),
    ...toPills('company', companies),
    ...toPills('place', cities),
    ...toPills('place', countries),
    ...toPills('topic', tagLabels('topic', meta.topics)),
  ];
}
