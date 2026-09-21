import {
  TAG_DEFINITIONS,
  type TagDefinition,
  type TagKind,
} from '../../constants/episodeVocabulary';
import { normalizeSearchText } from './searchText';

/**
 * Finds the tag whose slug, label or alias exactly matches `raw`
 * (case/width-insensitive). Returns null when nothing matches.
 */
export function resolveTag(kind: TagKind, raw: string): TagDefinition | null {
  const wanted = normalizeSearchText(raw);
  if (wanted === '') return null;

  return (
    TAG_DEFINITIONS[kind].find((tag) =>
      [tag.slug, tag.label, ...tag.aliases].some(
        (candidate) => normalizeSearchText(candidate) === wanted
      )
    ) ?? null
  );
}

/**
 * Looks up a tag by its slug (as stored in episodeMeta.json).
 */
export function findTagBySlug(
  kind: TagKind,
  slug: string
): TagDefinition | null {
  return TAG_DEFINITIONS[kind].find((tag) => tag.slug === slug) ?? null;
}
