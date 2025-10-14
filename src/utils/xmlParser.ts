import type { PodcastEpisode, RSSChannel } from "./types";

/**
 * 正規表現を使用してRSS XMLをパースする
 */
export function parseRSSWithRegex(xmlText: string): RSSChannel {
  // チャンネル情報を抽出
  const titleMatch = xmlText.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s);
  const descriptionMatch = xmlText.match(
    /<description><!\[CDATA\[(.*?)\]\]><\/description>/s
  );
  const linkMatch = xmlText.match(/<link>(.*?)<\/link>/s);
  const languageMatch = xmlText.match(
    /<language><!\[CDATA\[(.*?)\]\]><\/language>/s
  );
  const imageMatch = xmlText.match(/<itunes:image href="(.*?)"/);

  const title = titleMatch ? titleMatch[1].trim() : "";
  const description = descriptionMatch ? descriptionMatch[1].trim() : "";
  const link = linkMatch ? linkMatch[1].trim() : "";
  const language = languageMatch ? languageMatch[1].trim() : "ja";
  const image = imageMatch ? imageMatch[1].trim() : "";

  // エピソードを抽出（より安全な文字列分割を使用）
  const episodes: PodcastEpisode[] = [];
  const itemParts = xmlText.split("<item>");

  for (let i = 1; i < itemParts.length; i++) {
    const itemContent = itemParts[i].split("</item>")[0];

    if (!itemContent || itemContent.length === 0) {
      continue;
    }

    const title =
      extractWithRegex(itemContent, /<title><!\[CDATA\[(.*?)\]\]><\/title>/s) ||
      "";
    const description =
      extractWithRegex(
        itemContent,
        /<description><!\[CDATA\[(.*?)\]\]><\/description>/s
      ) || "";

    const episode: PodcastEpisode = {
      title,
      description,
      duration:
        extractWithRegex(
          itemContent,
          /<itunes:duration>(.*?)<\/itunes:duration>/
        ) || "00:00:00",
      date: extractWithRegex(itemContent, /<pubDate>(.*?)<\/pubDate>/) || "",
      link: extractWithRegex(itemContent, /<link>(.*?)<\/link>/) || "",
      audioUrl: extractWithRegex(itemContent, /<enclosure url="(.*?)"/) || "",
      guid:
        extractWithRegex(
          itemContent,
          /<guid isPermaLink="false">(.*?)<\/guid>/
        ) || "",
    };

    episodes.push(episode);
  }

  return {
    title,
    description,
    link,
    language,
    image,
    episodes,
  };
}

/**
 * 正規表現を使用してテキストを抽出する
 */
function extractWithRegex(text: string, regex: RegExp): string {
  const match = text.match(regex);
  if (match) {
    // HTMLタグを除去してテキストのみを返す
    let content = match[1].replace(/<[^>]*>/g, "").trim();

    // 「ゲスト：」以降の部分を削除
    const guestIndex = content.indexOf("ゲスト：");
    if (guestIndex !== -1) {
      content = content.substring(0, guestIndex).trim();
    }

    return content;
  }
  return "";
}
