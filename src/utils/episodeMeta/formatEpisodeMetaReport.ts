import type { TagKind } from '../../constants/episodeVocabulary';
import type { EpisodeMeta, PodcastEpisode } from '../../types';
import { findTagBySlug } from './resolveTag';

const labels = (kind: TagKind, slugs: string[]): string =>
  slugs
    .map((slug) => findTagBySlug(kind, slug)?.label ?? `?${slug}`)
    .join('、');

/**
 * Formats one episode's metadata as readable lines for the review report,
 * so a human can skim all episodes instead of reading raw JSON.
 */
export function formatEpisodeMetaReport(
  episode: Pick<PodcastEpisode, 'title'>,
  meta: EpisodeMeta
): string {
  const guests =
    meta.guests.length === 0
      ? '(ゲストなし)'
      : meta.guests
          .map((g) =>
            [g.name, g.position, g.company].map((v) => v ?? '—').join(' / ')
          )
          .join(' ; ');

  return [
    `${meta.reviewed ? '✓' : '·'} ${episode.title.slice(0, 60)}`,
    `    guests:    ${guests}`,
    `    role:      ${labels('role', meta.roles) || '—'}`,
    `    place:     ${labels('city', meta.cities) || '—'} @ ${labels('country', meta.countries) || '—'}`,
    `    topics:    ${labels('topic', meta.topics) || '—'}`,
  ].join('\n');
}
