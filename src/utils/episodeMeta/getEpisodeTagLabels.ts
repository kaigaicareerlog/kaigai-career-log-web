import type { EpisodeMeta } from '../../types';
import { findTagBySlug } from './resolveTag';

/**
 * Labels of an episode's tags (countries, cities, roles, topics, in that
 * order), e.g. ['カナダ', 'バンクーバー', 'エンジニア']
 */
export function getEpisodeTagLabels(meta: EpisodeMeta | undefined): string[] {
  if (!meta) return [];
  return [
    ...meta.countries.map((slug) => findTagBySlug('country', slug)),
    ...meta.cities.map((slug) => findTagBySlug('city', slug)),
    ...meta.roles.map((slug) => findTagBySlug('role', slug)),
    ...meta.topics.map((slug) => findTagBySlug('topic', slug)),
  ].flatMap((tag) => (tag ? [tag.label] : []));
}
