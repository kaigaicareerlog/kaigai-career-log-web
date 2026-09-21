import type { TagKind } from '../../constants/episodeVocabulary';
import type { EpisodeMeta, PodcastEpisode } from '../../types';
import { findTagBySlug } from './resolveTag';
import { normalizeSearchText } from './searchText';

const TAG_KINDS: readonly TagKind[] = ['role', 'country', 'city', 'topic'];

function tagSlugs(meta: EpisodeMeta, kind: TagKind): string[] {
  const byKind: Record<TagKind, string[]> = {
    role: meta.roles,
    country: meta.countries,
    city: meta.cities,
    topic: meta.topics,
  };
  return byKind[kind];
}

/**
 * Builds the normalized text the home-page search matches against for one
 * episode: title, description, every guest field (including the guest's name,
 * which is searchable but never shown as a pill) and each tag's label,
 * aliases and search aliases (so "canada", "カナダ" and "北米" all match).
 */
export function buildEpisodeSearchText(
  episode: Pick<PodcastEpisode, 'title' | 'description'>,
  meta?: EpisodeMeta
): string {
  const parts: string[] = [episode.title, episode.description];

  if (meta) {
    for (const guest of meta.guests) {
      parts.push(guest.name ?? '', guest.position ?? '', guest.company ?? '');
    }

    for (const kind of TAG_KINDS) {
      for (const slug of tagSlugs(meta, kind)) {
        const tag = findTagBySlug(kind, slug);
        if (!tag) continue;
        parts.push(
          tag.label,
          tag.slug,
          ...tag.aliases,
          ...(tag.searchAliases ?? [])
        );
      }
    }
  }

  return normalizeSearchText(parts.join(' '));
}
