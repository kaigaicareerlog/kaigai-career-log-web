import {
  MAX_TAGS_PER_KIND,
  TAG_DEFINITIONS,
  type TagDefinition,
  type TagKind,
} from '../../constants/episodeVocabulary';
import type { EpisodeGuest, EpisodeMeta } from '../../types';
import { resolveTag } from './resolveTag';

export interface ParsedEpisodeMeta {
  meta: EpisodeMeta;
  /** Things the model returned that could not be used (for the review report) */
  warnings: string[];
  /**
   * Countries/cities missing from the vocabulary that the model described
   * well enough to add. Their slugs are already in `meta`; the caller adds the
   * definitions with addPlaceTags so the tags (and map pins) show up.
   */
  newPlaces: NewPlace[];
}

export interface NewPlace {
  kind: 'country' | 'city';
  tag: TagDefinition;
}

const EMPTY_VALUES = new Set(['', 'null', 'none', 'n/a', '不明', 'なし', '-']);

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return EMPTY_VALUES.has(trimmed.toLowerCase()) ? null : trimmed;
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function parseGuests(value: unknown): EpisodeGuest[] {
  const guests = toArray(value)
    .map((item): EpisodeGuest => {
      const guest = (item ?? {}) as Record<string, unknown>;
      return {
        name: cleanString(guest.name),
        position: cleanString(guest.position),
        company: cleanString(guest.company),
      };
    })
    .filter((guest) => guest.name || guest.position || guest.company);

  // Drop exact duplicates the model sometimes repeats
  const seen = new Set<string>();
  return guests.filter((guest) => {
    const key = JSON.stringify(guest);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseTags(
  kind: TagKind,
  value: unknown,
  warnings: string[]
): string[] {
  const slugs: string[] = [];

  for (const item of toArray(value)) {
    const raw = cleanString(item);
    if (!raw) continue;

    const tag = resolveTag(kind, raw);
    if (!tag) {
      warnings.push(`unknown ${kind}: ${raw}`);
    } else if (!slugs.includes(tag.slug)) {
      slugs.push(tag.slug);
    }
  }

  return slugs.slice(0, MAX_TAGS_PER_KIND[kind]);
}

const PLACE_KINDS = ['country', 'city'] as const;

/** "New Zealand" -> "new-zealand"; null when nothing URL-safe is left */
export function toPlaceSlug(name: string): string | null {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug === '' ? null : slug;
}

function isCoordinate(value: unknown, max: number): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    Math.abs(value) <= max
  );
}

/**
 * One "otherPlaces" item: {kind, name, label, lat, lon}. A place that is
 * already in the vocabulary just gets its slug added; a new one becomes a
 * NewPlace when every field is usable. Plain strings (the old format) are
 * only reported.
 */
function parseOtherPlace(
  item: unknown,
  meta: EpisodeMeta,
  newPlaces: NewPlace[],
  warnings: string[]
): void {
  if (typeof item === 'string') {
    const name = cleanString(item);
    if (name && !resolveTag('city', name) && !resolveTag('country', name)) {
      warnings.push(`place not in vocabulary: ${name}`);
    }
    return;
  }

  const place = (item ?? {}) as Record<string, unknown>;
  const kind = PLACE_KINDS.find((k) => k === place.kind);
  const name = cleanString(place.name);
  const label = cleanString(place.label);
  if (!kind || !name) return;

  const field = kind === 'country' ? 'countries' : 'cities';
  const known = resolveTag(kind, name) ?? (label && resolveTag(kind, label));
  if (known) {
    if (!meta[field].includes(known.slug)) meta[field].push(known.slug);
    return;
  }

  const slug = toPlaceSlug(name);
  const usable =
    slug &&
    label &&
    isCoordinate(place.lat, 90) &&
    isCoordinate(place.lon, 180);
  if (!usable) {
    warnings.push(`place not in vocabulary: ${label ?? name}`);
    return;
  }

  const taken = Object.values(TAG_DEFINITIONS)
    .flat()
    .some((tag) => tag.slug === slug);
  if (taken || newPlaces.some((p) => p.tag.slug === slug)) {
    warnings.push(`place slug already used by another tag: ${slug}`);
    return;
  }

  newPlaces.push({
    kind,
    tag: {
      slug,
      label,
      aliases: [name.toLowerCase()],
      lat: Math.round((place.lat as number) * 10000) / 10000,
      lon: Math.round((place.lon as number) * 10000) / 10000,
    },
  });
  meta[field].push(slug);
}

/**
 * Validates the JSON returned by the model and converts it to EpisodeMeta.
 * Values outside the controlled vocabulary are dropped and reported as
 * warnings, except new countries/cities described in "otherPlaces" (see
 * parseOtherPlace); the result always has `reviewed: false`.
 */
export function parseEpisodeMeta(raw: unknown): ParsedEpisodeMeta {
  const data = (raw ?? {}) as Record<string, unknown>;
  const warnings: string[] = [];

  const meta: EpisodeMeta = {
    guests: parseGuests(data.guests),
    roles: parseTags('role', data.roles, warnings),
    countries: parseTags('country', data.countries, warnings),
    cities: parseTags('city', data.cities, warnings),
    topics: parseTags('topic', data.topics, warnings),
    reviewed: false,
  };

  // Places the model flagged as missing from the lists
  const newPlaces: NewPlace[] = [];
  for (const place of toArray(data.otherPlaces)) {
    parseOtherPlace(place, meta, newPlaces, warnings);
  }
  meta.countries = meta.countries.slice(0, MAX_TAGS_PER_KIND.country);
  meta.cities = meta.cities.slice(0, MAX_TAGS_PER_KIND.city);

  return { meta, warnings, newPlaces };
}
