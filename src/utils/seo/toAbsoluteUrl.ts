import { SITE_URL } from '../../constants/site';

/**
 * Converts a site-relative path (or absolute URL) to an absolute URL on SITE_URL
 */
export function toAbsoluteUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, SITE_URL).href;
}
