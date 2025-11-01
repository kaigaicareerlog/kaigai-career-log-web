import fs from 'fs';
import path from 'path';
import type { PodcastEpisode } from '../types';

/**
 * 最新のepisodes.jsonファイルを取得する
 */
function getLatestEpisodesFile(): string {
  const rssDir = path.join(process.cwd(), 'public', 'rss');

  // 最新の日付付きファイルを探す
  const files = fs.readdirSync(rssDir);
  const episodesFiles = files
    .filter((file) => file.match(/^\d{8}-\d{4}-episodes\.json$/))
    .sort()
    .reverse();

  if (episodesFiles.length > 0) {
    return path.join(rssDir, episodesFiles[0]);
  }

  throw new Error('No episodes files found');
}

/**
 * JSONファイルからポッドキャストデータを読み込む
 */
export async function getLatestEpisodes(): Promise<{
  episodes: PodcastEpisode[];
}> {
  try {
    // 最新のepisodes.jsonを読み込む
    const jsonPath = getLatestEpisodesFile();
    const jsonText = fs.readFileSync(jsonPath, 'utf-8');

    return {
      episodes: JSON.parse(jsonText) as PodcastEpisode[],
    };
  } catch (error) {
    console.error('Error parsing JSON feed:', error);
    throw error;
  }
}
