/**
 * SEO helpers: meta text, absolute URLs and schema.org JSON-LD builders
 */
export {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildPodcastEpisodeJsonLd,
  buildPodcastSeriesJsonLd,
} from './buildJsonLd';
export type {
  BreadcrumbItem,
  JsonLd,
  PodcastEpisodeDetails,
} from './buildJsonLd';
export { toAbsoluteUrl } from './toAbsoluteUrl';
export { toIsoDuration } from './toIsoDuration';
export { truncateText } from './truncateText';
