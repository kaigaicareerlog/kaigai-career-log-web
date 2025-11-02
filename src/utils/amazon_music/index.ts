/**
 * Amazon Music utilities for fetching podcast episode URLs
 *
 * Amazon Music doesn't have a public API, so we use browser automation
 * with Puppeteer to scrape episode information.
 */
export { extractShowIdFromUrl } from './extractShowIdFromUrl';
export { getAmazonMusicEpisodes } from './getAmazonMusicEpisodes';
export { findAmazonMusicEpisodeByTitle } from './findAmazonMusicEpisodeByTitle';
export { getAmazonMusicConfidentials } from './getAmazonMusicConfidentials';
export type { AmazonMusicEpisode } from './types';

