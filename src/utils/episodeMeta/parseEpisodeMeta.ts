import {
  MAX_TAGS_PER_KIND,
  type TagKind,
} from '../../constants/episodeVocabulary';
import type { EpisodeGuest, EpisodeMeta } from '../../types';
import { resolveTag } from './resolveTag';

export interface ParsedEpisodeMeta {
  meta: EpisodeMeta;
  /** Things the model returned that could not be used (for the review report) */
  warnings: string[];
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

/**
 * Validates the JSON returned by the model and converts it to EpisodeMeta.
 * Values outside the controlled vocabulary are dropped and reported as
 * warnings; the result always has `reviewed: false`.
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

  // Places the model flagged as missing: ignore ones we actually know
  for (const place of toArray(data.otherPlaces)) {
    const name = cleanString(place);
    if (name && !resolveTag('city', name) && !resolveTag('country', name)) {
      warnings.push(`place not in vocabulary: ${name}`);
    }
  }

  return { meta, warnings };
}
