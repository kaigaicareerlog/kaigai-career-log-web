/**
 * iTunes Search API utilities for fetching Apple Podcasts episode URLs
 *
 * The iTunes Search API is free and doesn't require authentication!
 *
 * API Documentation:
 * https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
 *
 * No API key required!
 */
export { extractPodcastIdFromUrl } from './extractPodcastIdFromUrl';
export { getApplePodcastEpisodes } from './getApplePodcastEpisodes';
export { findApplePodcastEpisodeByTitle } from './findApplePodcastEpisodeByTitle';
export { searchPodcastByName } from './searchPodcastByName';
export { getApplePodcastConfidentials } from './getApplePodcastConfidentials';
export type { ApplePodcastEpisode } from './types';

