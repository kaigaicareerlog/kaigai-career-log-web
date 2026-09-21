import fs from 'fs';
import path from 'path';
import type { EpisodeMeta, EpisodeMetaMap } from '../../types';

const EPISODE_META_PATH = path.join(
  process.cwd(),
  'src',
  'data',
  'episodeMeta.json'
);

let cachedMap: EpisodeMetaMap | null = null;

/**
 * Reads src/data/episodeMeta.json. Returns an empty map if the file doesn't
 * exist yet. The result is cached so pages can call this once per episode.
 */
export function readEpisodeMetaMap(): EpisodeMetaMap {
  if (cachedMap) return cachedMap;

  cachedMap = fs.existsSync(EPISODE_META_PATH)
    ? (JSON.parse(
        fs.readFileSync(EPISODE_META_PATH, 'utf-8')
      ) as EpisodeMetaMap)
    : {};
  return cachedMap;
}

/**
 * Metadata for one episode, or undefined if it hasn't been tagged yet.
 */
export function getEpisodeMeta(guid: string): EpisodeMeta | undefined {
  return readEpisodeMetaMap()[guid];
}

/**
 * Writes the map back to disk with stable key order so git diffs stay small.
 */
export function writeEpisodeMetaMap(map: EpisodeMetaMap): void {
  const sorted = Object.fromEntries(
    Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  );
  fs.mkdirSync(path.dirname(EPISODE_META_PATH), { recursive: true });
  fs.writeFileSync(
    EPISODE_META_PATH,
    `${JSON.stringify(sorted, null, 2)}\n`,
    'utf-8'
  );
  cachedMap = sorted;
}
