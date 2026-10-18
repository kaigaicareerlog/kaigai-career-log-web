// @ts-check
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const SITE = 'https://kaigaicareerlog.com';

/**
 * Last-modified date per page path, so search engines recrawl an episode
 * page when it is published and again when its transcript changes. Pages
 * not listed here get no lastmod.
 */
function readLastModified() {
  const rssDir = path.join(process.cwd(), 'public', 'rss');
  const latest = fs
    .readdirSync(rssDir)
    .filter((file) => /^\d{8}-\d{4}-episodes\.json$/.test(file))
    .sort()
    .pop();
  if (!latest) return new Map();

  /** @type {Array<{ guid: string; date: string }>} */
  const episodes = JSON.parse(
    fs.readFileSync(path.join(rssDir, latest), 'utf-8')
  );
  /** @type {Map<string, Date>} */
  const dates = new Map();

  for (const episode of episodes) {
    const published = new Date(episode.date);
    let lastmod = isNaN(published.getTime()) ? null : published;

    const transcriptPath = path.join(
      process.cwd(),
      'public',
      'transcripts',
      `${episode.guid}.json`
    );
    if (fs.existsSync(transcriptPath)) {
      const { transcribedAt } = JSON.parse(
        fs.readFileSync(transcriptPath, 'utf-8')
      );
      const transcribed = new Date(transcribedAt);
      if (
        !isNaN(transcribed.getTime()) &&
        (!lastmod || transcribed > lastmod)
      ) {
        lastmod = transcribed;
      }
    }

    if (lastmod) dates.set(`/episodes/${episode.guid}/`, lastmod);
  }

  // The home page changes whenever a new episode comes out
  const newest = episodes
    .map((episode) => new Date(episode.date))
    .filter((date) => !isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  if (newest) dates.set('/', newest);

  return dates;
}

const lastModified = readLastModified();

// https://astro.build/config
export default defineConfig({
  site: SITE,
  output: 'static',
  integrations: [
    sitemap({
      // The 404 page must not be listed in the sitemap
      filter: (page) => !page.endsWith('/404/'),
      serialize(item) {
        const lastmod = lastModified.get(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod: lastmod.toISOString() } : item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
