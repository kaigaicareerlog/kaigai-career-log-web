import fs from "fs";
import path from "path";
import type { RSSChannel } from "./types";

interface PodcastData {
  channel: {
    title: string;
    description: string;
    link: string;
    language: string;
    image: string;
  };
  episodes: Array<{
    title: string;
    description: string;
    link: string;
    guid: string;
    date: string;
    duration: string;
    audioUrl: string;
  }>;
  lastUpdated: string;
}

/**
 * 最新のepisodes.jsonファイルを取得する
 */
function getLatestEpisodesFile(): string {
  const rssDir = path.join(process.cwd(), "public", "rss");

  // 最新の日付付きファイルを探す
  const files = fs.readdirSync(rssDir);
  const episodesFiles = files
    .filter((file) => file.match(/^\d{8}-\d{4}-episodes\.json$/))
    .sort()
    .reverse();

  if (episodesFiles.length > 0) {
    return path.join(rssDir, episodesFiles[0]);
  }

  throw new Error("No episodes files found");
}

/**
 * JSONファイルからポッドキャストデータを読み込む
 */
export async function parseJSONFeed(): Promise<RSSChannel> {
  try {
    // 最新のepisodes.jsonを読み込む
    const jsonPath = getLatestEpisodesFile();
    const jsonText = fs.readFileSync(jsonPath, "utf-8");
    const data: PodcastData = JSON.parse(jsonText);

    // RSSChannel形式に変換
    return {
      title: data.channel.title,
      description: data.channel.description,
      link: data.channel.link,
      language: data.channel.language,
      image: data.channel.image,
      episodes: data.episodes.map((ep) => ({
        title: ep.title,
        description: ep.description,
        link: ep.link,
        guid: ep.guid,
        date: ep.date,
        duration: ep.duration,
        audioUrl: ep.audioUrl,
      })),
    };
  } catch (error) {
    console.error("Error parsing JSON feed:", error);
    throw error;
  }
}
