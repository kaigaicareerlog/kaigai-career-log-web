/**
 * Script to convert RSS XML to JSON
 * Usage: node scripts/xml-to-json.ts <input-xml-file> <output-json-file>
 */

import fs from "fs";

interface PodcastEpisode {
  title: string;
  description: string;
  link: string;
  guid: string;
  date: string;
  duration: string;
  audioUrl: string;
}

interface PodcastData {
  channel: {
    title: string;
    description: string;
    link: string;
    language: string;
    image: string;
  };
  episodes: PodcastEpisode[];
  lastUpdated: string;
}

/**
 * Extract text content from CDATA or regular text
 */
function extractText(text: string | undefined): string {
  if (!text) return "";

  // Remove CDATA wrapper
  const cdataMatch = text.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }

  return text.trim();
}

/**
 * Extract content using regex
 */
function extractWithRegex(text: string, regex: RegExp): string {
  const match = text.match(regex);
  if (!match) return "";

  let content = match[1] || "";
  content = extractText(content);

  // Remove HTML tags
  content = content.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  content = content
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Remove "ゲスト：" and everything after it
  const guestIndex = content.indexOf("ゲスト：");
  if (guestIndex !== -1) {
    content = content.substring(0, guestIndex).trim();
  }

  return content;
}

/**
 * Parse RSS XML to JSON
 */
function parseRSSToJSON(xmlText: string): PodcastData {
  // Extract channel info
  const title = extractWithRegex(xmlText, /<title>(.*?)<\/title>/);
  const description = extractWithRegex(
    xmlText,
    /<description>(.*?)<\/description>/
  );
  const link = extractWithRegex(xmlText, /<link>(.*?)<\/link>/);
  const language = extractWithRegex(xmlText, /<language>(.*?)<\/language>/);
  const imageMatch = xmlText.match(/<itunes:image\s+href="([^"]+)"/);
  const image = imageMatch ? imageMatch[1] : "";

  // Extract items
  const itemMatches = xmlText.split("<item>").slice(1);
  const episodes: PodcastEpisode[] = itemMatches.map((itemText) => {
    const itemContent = itemText.split("</item>")[0];

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
    const audioUrl = enclosureMatch ? enclosureMatch[1] : "";

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

  return {
    channel: {
      title,
      description,
      link,
      language,
      image,
    },
    episodes,
    lastUpdated: new Date().toISOString(),
  };
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error(
    "Usage: node scripts/xml-to-json.ts <input-xml-file> <output-json-file>"
  );
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];

try {
  console.log(`Reading XML from: ${inputFile}`);
  const xmlContent = fs.readFileSync(inputFile, "utf-8");

  console.log("Parsing XML to JSON...");
  const jsonData = parseRSSToJSON(xmlContent);

  console.log(`Writing JSON to: ${outputFile}`);
  fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2), "utf-8");

  console.log(`✅ Successfully converted ${jsonData.episodes.length} episodes`);
  console.log(`   Channel: ${jsonData.channel.title}`);
  console.log(`   Output: ${outputFile}`);
} catch (error) {
  console.error("❌ Error:", (error as Error).message);
  process.exit(1);
}
