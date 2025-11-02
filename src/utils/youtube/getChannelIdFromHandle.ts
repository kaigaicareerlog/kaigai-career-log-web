/**
 * Get channel ID from handle (e.g., @username)
 */
export async function getChannelIdFromHandle(
  handle: string,
  apiKey: string
): Promise<string> {
  // Remove @ if present
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;

  const url = new URL('https://www.googleapis.com/youtube/v3/channels');
  url.searchParams.append('part', 'id');
  url.searchParams.append('forHandle', cleanHandle);
  url.searchParams.append('key', apiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error(`Channel not found for handle: @${cleanHandle}`);
  }

  return data.items[0].id;
}

