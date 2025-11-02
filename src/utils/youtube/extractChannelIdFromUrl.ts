/**
 * Extract channel ID from YouTube channel URL
 * Supports formats:
 * - https://www.youtube.com/@username
 * - https://www.youtube.com/channel/UCxxxxx
 * - https://www.youtube.com/c/channelname
 */
export function extractChannelIdFromUrl(url: string): string | null {
  // Handle @username format - needs to be resolved via API
  const usernameMatch = url.match(/@([^/?]+)/);
  if (usernameMatch) {
    return `@${usernameMatch[1]}`;
  }

  // Handle channel ID format
  const channelMatch = url.match(/channel\/([^/?]+)/);
  if (channelMatch) {
    return channelMatch[1];
  }

  // Handle custom URL format
  const customMatch = url.match(/\/c\/([^/?]+)/);
  if (customMatch) {
    return customMatch[1];
  }

  return null;
}

