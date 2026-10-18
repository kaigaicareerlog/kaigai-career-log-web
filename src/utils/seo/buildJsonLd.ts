import {
  APPLE_PODCAST_CHANNEL_URL,
  AMAZON_MUSIC_CHANNEL_URL,
  SPOTIFY_CHANNEL_URL,
  YOUTUBE_CHANNEL_URL,
} from '../../constants/podcastUrls';
import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_OG_IMAGE,
  SITE_LANGUAGE,
  SITE_NAME,
  SITE_URL,
} from '../../constants/site';
import type { EpisodeGuest, PodcastEpisode } from '../../types';
import { toAbsoluteUrl } from './toAbsoluteUrl';
import { toIsoDuration } from './toIsoDuration';

export type JsonLd = Record<string, unknown>;

export interface BreadcrumbItem {
  name: string;
  /** Site-relative path or absolute URL */
  url: string;
}

/**
 * schema.org PodcastSeries describing the podcast as a whole (home page)
 */
export function buildPodcastSeriesJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: SITE_DEFAULT_DESCRIPTION,
    inLanguage: SITE_LANGUAGE,
    image: toAbsoluteUrl(SITE_DEFAULT_OG_IMAGE),
    sameAs: [
      SPOTIFY_CHANNEL_URL,
      APPLE_PODCAST_CHANNEL_URL,
      YOUTUBE_CHANNEL_URL,
      AMAZON_MUSIC_CHANNEL_URL,
    ],
  };
}

export interface PodcastEpisodeDetails {
  /** Hosts heard in the episode */
  hostNames?: string[];
  /** Tagged guests (name, position, company) */
  guests?: EpisodeGuest[];
  /** Tag labels (countries, cities, roles, topics) */
  keywords?: string[];
}

function guestPerson(guest: EpisodeGuest): JsonLd | null {
  if (!guest.name) return null;
  return {
    '@type': 'Person',
    name: guest.name,
    ...(guest.position ? { jobTitle: guest.position } : {}),
    ...(guest.company
      ? { worksFor: { '@type': 'Organization', name: guest.company } }
      : {}),
  };
}

/**
 * schema.org PodcastEpisode for an episode page
 * @param episode - The episode being rendered
 * @param pageUrl - Canonical absolute URL of the episode page
 * @param details - People and tags, when known
 */
export function buildPodcastEpisodeJsonLd(
  episode: PodcastEpisode,
  pageUrl: string,
  { hostNames = [], guests = [], keywords = [] }: PodcastEpisodeDetails = {}
): JsonLd {
  const published = new Date(episode.date);
  const actors = [
    ...hostNames.map((name) => ({ '@type': 'Person', name })),
    ...guests.flatMap((guest) => guestPerson(guest) ?? []),
  ];
  // The same episode on the listening platforms
  const sameAs = [
    episode.spotifyUrl,
    episode.applePodcastUrl,
    episode.youtubeUrl,
    episode.amazonMusicUrl,
  ].filter((url): url is string => Boolean(url));

  return {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: episode.title,
    url: pageUrl,
    description: episode.description,
    inLanguage: SITE_LANGUAGE,
    ...(isNaN(published.getTime())
      ? {}
      : { datePublished: published.toISOString() }),
    timeRequired: toIsoDuration(episode.duration),
    ...(episode.audioUrl
      ? {
          associatedMedia: {
            '@type': 'AudioObject',
            contentUrl: episode.audioUrl,
          },
        }
      : {}),
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: SITE_NAME,
      url: `${SITE_URL}/`,
    },
    ...(actors.length > 0 ? { actor: actors } : {}),
    ...(keywords.length > 0 ? { keywords: keywords.join(', ') } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/**
 * schema.org BreadcrumbList, e.g. Home > Episodes > <title>
 */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.url),
    })),
  };
}

/**
 * schema.org CollectionPage whose main entity is the list of episodes on a
 * tag page.
 */
export function buildCollectionPageJsonLd(page: {
  name: string;
  description: string;
  /** Site-relative path or absolute URL of the page itself */
  url: string;
  /** Site-relative paths or absolute URLs of the episodes, in order */
  episodeUrls: string[];
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: page.name,
    description: page.description,
    url: toAbsoluteUrl(page.url),
    inLanguage: SITE_LANGUAGE,
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_URL}/` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: page.episodeUrls.length,
      itemListElement: page.episodeUrls.map((url, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: toAbsoluteUrl(url),
      })),
    },
  };
}
