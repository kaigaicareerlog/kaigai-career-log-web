import fs from 'fs';
import path from 'path';
import type { PodcastEpisode } from '../types';
import {
  chooseEpisodeCatalog,
  type CatalogCandidate,
} from './rss/episodeCatalogGuard';

/**
 * Reads an episodes file. Accepts the current array format and the older
 * `{ episodes }` shape. Returns null when the file cannot be used as a catalog.
 */
export function readEpisodeCatalog(filePath: string): PodcastEpisode[] | null {
  try {
    const data: unknown = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (Array.isArray(data)) return data as PodcastEpisode[];
    if (isEpisodeWrapper(data)) return data.episodes;
    return null;
  } catch {
    return null;
  }
}

function isEpisodeWrapper(
  data: unknown
): data is { episodes: PodcastEpisode[] } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'episodes' in data &&
    Array.isArray(data.episodes)
  );
}

/**
 * Newest usable episodes file. A newer file that is empty, invalid, or a
 * sharp drop is skipped so callers keep the previous catalog.
 */
export function findLatestEpisodesFile(rssDir?: string): string {
  const directory = rssDir ?? path.join(process.cwd(), 'public', 'rss');

  if (!fs.existsSync(directory)) {
    throw new Error(`RSS directory not found: ${directory}`);
  }

  const names = fs
    .readdirSync(directory)
    .filter((file) => /^\d{8}-\d{4}-episodes\.json$/.test(file))
    .sort()
    .reverse();

  if (names.length === 0) {
    throw new Error('No episodes files found');
  }

  const candidates: CatalogCandidate<PodcastEpisode>[] = names.map((name) => ({
    id: name,
    episodes: readEpisodeCatalog(path.join(directory, name)),
  }));
  const chosen = chooseEpisodeCatalog(candidates);

  if (!chosen) {
    throw new Error('No usable episodes catalog found');
  }

  if (chosen.id !== names[0]) {
    console.warn(
      `Skipping newer episodes file(s); using ${chosen.id} so the existing catalog stays in place`
    );
  }

  return path.join(directory, chosen.id);
}
