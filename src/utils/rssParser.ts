import fs from "fs";
import path from "path";
import type { RSSChannel } from "./types";
import { parseRSSWithRegex } from "./xmlParser";

/**
 * RSS XMLをパースしてポッドキャストデータを抽出する
 */
export async function parseRSSFeed(): Promise<RSSChannel> {
  try {
    // AstroのサーバーサイドでRSSファイルを読み込む
    const rssPath = path.join(process.cwd(), "public", "rss", "test.xml");
    const xmlText = fs.readFileSync(rssPath, "utf-8");

    // シンプルな正規表現ベースのパース
    return parseRSSWithRegex(xmlText);
  } catch (error) {
    console.error("Error parsing RSS feed:", error);
    throw error;
  }
}
