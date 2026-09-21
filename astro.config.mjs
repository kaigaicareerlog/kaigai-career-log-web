// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://kaigaicareerlog.com',
  output: 'static',
  integrations: [
    sitemap({
      // The 404 page must not be listed in the sitemap
      filter: (page) => !page.endsWith('/404/'),
    }),
  ],
});
