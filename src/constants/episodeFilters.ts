import type { TagKind } from './episodeVocabulary';

export interface FilterTag {
  readonly kind: TagKind;
  readonly slug: string;
}

/**
 * Tags offered as quick-filter chips under the search box, in display order.
 * Labels come from the vocabulary in episodeVocabulary.ts.
 */
export const FEATURED_FILTER_TAGS: readonly FilterTag[] = [
  { kind: 'country', slug: 'canada' },
  { kind: 'country', slug: 'usa' },
  { kind: 'city', slug: 'vancouver' },
  { kind: 'topic', slug: 'english' },
  { kind: 'topic', slug: 'salary' },
  { kind: 'topic', slug: 'visa' },
  { kind: 'topic', slug: 'no-experience' },
  { kind: 'topic', slug: 'job-change' },
  { kind: 'topic', slug: 'layoff' },
];

/**
 * The 特別回 chip. Special episodes are recognised from the title (see
 * isSpecialEpisode), not from the tag vocabulary, so this isn't a FilterTag.
 */
export const SPECIAL_EPISODE_FILTER = {
  slug: 'special',
  label: '特別回',
} as const;
