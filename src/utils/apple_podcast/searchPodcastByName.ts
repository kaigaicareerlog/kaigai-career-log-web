/**
 * Search for a podcast by name using iTunes Search API
 * Useful for finding the podcast ID if you don't have it
 */
export async function searchPodcastByName(
  podcastName: string,
  limit: number = 10
): Promise<
  Array<{
    collectionId: number;
    collectionName: string;
    artistName: string;
    collectionViewUrl: string;
  }>
> {
  const url = new URL('https://itunes.apple.com/search');
  url.searchParams.append('term', podcastName);
  url.searchParams.append('media', 'podcast');
  url.searchParams.append('entity', 'podcast');
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`iTunes API error: ${response.statusText}`);
  }

  const data = await response.json();

  return data.results || [];
}

