import type { APIRoute, GetStaticPaths } from 'astro';
import type { PodcastEpisode } from '../../types';
import { buildEpisodeMarkdown } from '../../utils/aeo/buildEpisodeMarkdown';
import { getEpisodeMeta } from '../../utils/episodeMeta/episodeMetaFile';
import { getEpisodeTagLabels } from '../../utils/episodeMeta/getEpisodeTagLabels';
import { getLatestEpisodes } from '../../utils/getLatestEpisodes';
import { toAbsoluteUrl } from '../../utils/seo';
import {
  getTranscriptHighlights,
  readTranscriptIfExists,
} from '../../utils/transcript/readTranscriptIfExists';

/** Markdown copy of each episode page, for AI assistants (see /llms.txt) */
export const getStaticPaths = (async () => {
  const { episodes } = await getLatestEpisodes();
  return episodes.map((episode) => ({
    params: { guid: episode.guid },
    props: { episode },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const { episode } = props as { episode: PodcastEpisode };
  const meta = getEpisodeMeta(episode.guid);
  const transcript = readTranscriptIfExists(episode.guid);

  const markdown = buildEpisodeMarkdown({
    episode,
    pageUrl: toAbsoluteUrl(`/episodes/${episode.guid}/`),
    guests: meta?.guests,
    tags: getEpisodeTagLabels(meta),
    highlights: getTranscriptHighlights(transcript),
    utterances: transcript?.utterances,
  });

  return new Response(markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
