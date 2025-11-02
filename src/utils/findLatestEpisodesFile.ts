import fs from 'fs';
import path from 'path';

export function findLatestEpisodesFile(rssDir?: string): string {
  if (!rssDir) {
    rssDir = path.join(process.cwd(), 'public', 'rss');
  }

  if (!fs.existsSync(rssDir)) {
    throw new Error(`RSS directory not found: ${rssDir}`);
  }

  const files = fs.readdirSync(rssDir);
  const episodesFiles = files
    .filter((file) => file.match(/^\d{8}-\d{4}-episodes\.json$/))
    .sort()
    .reverse();

  if (episodesFiles.length === 0) {
    throw new Error('No episodes files found');
  }

  return path.join(rssDir, episodesFiles[0]);
}
