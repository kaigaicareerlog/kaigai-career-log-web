/**
 * SEO helpers: meta text, absolute URLs and schema.org JSON-LD builders
 */
export {
  buildBreadcrumbJsonLd,
  buildPodcastEpisodeJsonLd,
  buildPodcastSeriesJsonLd,
} from './buildJsonLd';
export type { BreadcrumbItem, JsonLd } from './buildJsonLd';
export { toAbsoluteUrl } from './toAbsoluteUrl';
export { toIsoDuration } from './toIsoDuration';
export { truncateText } from './truncateText';
