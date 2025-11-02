import type { PodcastEpisode } from '../../types';
import { extractWithRegex } from './extractWithRegex';

export function parseRSSToEpisodes(xmlText: string): PodcastEpisode[] {
  // Extract items
  const itemMatches = xmlText.split('<item>').slice(1);
  const episodes: PodcastEpisode[] = itemMatches.map((itemText) => {
    const itemContent = itemText.split('</item>')[0];

    const title = extractWithRegex(itemContent, /<title>(.*?)<\/title>/s);
    const description = extractWithRegex(
      itemContent,
      /<description>(.*?)<\/description>/s
    );
    const link = extractWithRegex(itemContent, /<link>(.*?)<\/link>/s);
    const guid = extractWithRegex(itemContent, /<guid[^>]*>(.*?)<\/guid>/s);
    const pubDate = extractWithRegex(itemContent, /<pubDate>(.*?)<\/pubDate>/s);
    const duration = extractWithRegex(
      itemContent,
      /<itunes:duration>(.*?)<\/itunes:duration>/s
    );

    const enclosureMatch = itemContent.match(/<enclosure\s+url="([^"]+)"/);
    const audioUrl = enclosureMatch ? enclosureMatch[1] : '';

    return {
      title,
      description,
      link,
      guid,
      date: pubDate,
      duration,
      audioUrl,
    };
  });

  return episodes;
}
