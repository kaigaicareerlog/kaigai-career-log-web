import type { APIRoute, GetStaticPaths } from 'astro';
import type { PodcastEpisode } from '../../../types';
import { getEpisodeMeta } from '../../../utils/episodeMeta/episodeMetaFile';
import { findTagBySlug } from '../../../utils/episodeMeta/resolveTag';
import { getLatestEpisodes } from '../../../utils/getLatestEpisodes';
import { renderEpisodeOgImage } from '../../../utils/og/renderEpisodeOgImage';

/** One share image per episode, generated at build time */
export const getStaticPaths = (async () => {
  const { episodes } = await getLatestEpisodes();
  return episodes.map((episode) => ({
    params: { guid: episode.guid },
    props: { episode },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { episode } = props as { episode: PodcastEpisode };
  const meta = getEpisodeMeta(episode.guid);

  // The first city and the first country, e.g. バンクーバー / カナダ
  const places = [
    meta?.cities[0] && findTagBySlug('city', meta.cities[0])?.label,
    meta?.countries[0] && findTagBySlug('country', meta.countries[0])?.label,
  ].filter((label): label is string => Boolean(label));

  const png = await renderEpisodeOgImage({
    title: episode.title,
    guests: meta?.guests ?? [],
    places,
  });

  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
