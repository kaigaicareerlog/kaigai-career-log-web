import fs from 'fs';
import path from 'path';
import type { RSSChannel } from '../types';
import { parseRSSWithRegex } from './xmlParser';

/**
 * 最新のRSSファイルを取得する
 */
function getLatestRSSFile(): string {
  const rssDir = path.join(process.cwd(), 'public', 'rss');

  // latest.xml シンボリックリンクが存在する場合はそれを使用
  const latestSymlink = path.join(rssDir, 'latest.xml');
  if (fs.existsSync(latestSymlink)) {
    return latestSymlink;
  }

  // シンボリックリンクがない場合は、最新の日付付きファイルを探す
  const files = fs.readdirSync(rssDir);
  const rssFiles = files
    .filter((file) => file.match(/^\d{8}-\d{4}-rss-file\.xml$/))
    .sort()
    .reverse();

  if (rssFiles.length > 0) {
    return path.join(rssDir, rssFiles[0]);
  }

  // フォールバック: test.xml
  return path.join(rssDir, 'test.xml');
}

/**
 * RSS XMLからチャンネルデータを取得する
 */
export async function getChannelData(): Promise<RSSChannel> {
  try {
    // 最新のRSSファイルを読み込む
    const rssPath = getLatestRSSFile();
    const xmlText = fs.readFileSync(rssPath, 'utf-8');

    // シンプルな正規表現ベースのパース
    return parseRSSWithRegex(xmlText);
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    throw error;
  }
}
