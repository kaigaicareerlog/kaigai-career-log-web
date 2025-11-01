/**
 * Script to generate episodes.json with additional metadata
 * Reads RSS XML file directly and outputs just the episodes array
 * Usage: node scripts/generate-episodes.ts <input-xml-file> <output-episodes-file>
 */

import fs from 'fs';
import path from 'path';

interface PodcastEpisode {
  title: string;
  description: string;
  link: string;
  guid: string;
  date: string;
  duration: string;
  audioUrl: string;
}

interface EpisodeWithMetadata extends PodcastEpisode {
  spotifyUrl: string;
  youtubeUrl: string;
  applePodcastUrl: string;
  amazonMusicUrl: string;
}

/**
 * Extract text content from CDATA or regular text
 */
function extractText(text: string | undefined): string {
  if (!text) return '';

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
  if (!match) return '';

  let content = match[1] || '';
  content = extractText(content);

  // Remove HTML tags
  content = content.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  content = content
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Remove "ゲスト：" and everything after it
  const guestIndex = content.indexOf('ゲスト：');
  if (guestIndex !== -1) {
    content = content.substring(0, guestIndex).trim();
  }

  return content;
}

/**
 * Parse RSS XML to episodes
 */
function parseRSSToEpisodes(xmlText: string): PodcastEpisode[] {
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

/**
 * Find the latest episodes file
 */
function findLatestEpisodesFile(rssDir: string): string | null {
  if (!fs.existsSync(rssDir)) {
    return null;
  }

  const files = fs.readdirSync(rssDir);
  const episodesFiles = files
    .filter((file) => file.match(/^\d{8}-\d{4}-episodes\.json$/))
    .sort()
    .reverse();

  if (episodesFiles.length > 0) {
    return path.join(rssDir, episodesFiles[0]);
  }

  return null;
}

/**
 * Load existing episodes from the latest episodes file
 */
function loadExistingEpisodes(
  outputPath: string
): Map<string, EpisodeWithMetadata> {
  const episodeMap = new Map<string, EpisodeWithMetadata>();

  // Get directory from output path
  const rssDir = path.dirname(outputPath);
  const latestFile = findLatestEpisodesFile(rssDir);

  if (latestFile && fs.existsSync(latestFile)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));
      
      // Handle both old format (with channel) and new format (array only)
      const episodes = Array.isArray(existingData) 
        ? existingData 
        : existingData.episodes || [];
      
      episodes.forEach((episode: EpisodeWithMetadata) => {
        episodeMap.set(episode.guid, episode);
      });
      console.log(
        `Loaded ${episodeMap.size} existing episodes from ${path.basename(
          latestFile
        )}`
      );
    } catch (error) {
      console.warn(
        'Could not load existing episodes file:',
        (error as Error).message
      );
    }
  } else {
    console.log('No existing episodes files found, creating new file');
  }

  return episodeMap;
}

/**
 * Generate episodes with metadata
 */
function generateEpisodes(
  rssEpisodes: PodcastEpisode[],
  existingEpisodes: Map<string, EpisodeWithMetadata>
): EpisodeWithMetadata[] {
  const episodes: EpisodeWithMetadata[] = rssEpisodes.map((episode) => {
    const existing = existingEpisodes.get(episode.guid);

    if (existing) {
      // Keep existing episode with all its metadata
      return {
        ...episode,
        spotifyUrl: existing.spotifyUrl,
        youtubeUrl: existing.youtubeUrl,
        applePodcastUrl: existing.applePodcastUrl,
        amazonMusicUrl: existing.amazonMusicUrl,
      };
    } else {
      // New episode - empty URLs
      const newEpisode: EpisodeWithMetadata = {
        ...episode,
        spotifyUrl: '',
        youtubeUrl: '',
        applePodcastUrl: '',
        amazonMusicUrl: '',
      };
      return newEpisode;
    }
  });

  // Return episodes in the order from RSS data (latest first)
  return episodes;
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error(
    'Usage: node scripts/generate-episodes.ts <input-xml-file> <output-episodes-file>'
  );
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];

try {
  console.log(`Reading RSS XML from: ${inputFile}`);
  const xmlContent = fs.readFileSync(inputFile, 'utf-8');

  console.log('Parsing RSS XML to episodes...');
  const rssEpisodes = parseRSSToEpisodes(xmlContent);

  console.log(`Found ${rssEpisodes.length} episodes in RSS feed`);

  // Load existing episodes
  const existingEpisodes = loadExistingEpisodes(outputFile);

  // Generate episodes with metadata
  const episodes = generateEpisodes(rssEpisodes, existingEpisodes);

  console.log(`Writing episodes to: ${outputFile}`);
  // Output just the episodes array (no channel info)
  fs.writeFileSync(outputFile, JSON.stringify(episodes, null, 2), 'utf-8');

  console.log(`✅ Successfully generated ${episodes.length} episodes`);

  // Count new episodes
  const newEpisodes = episodes.filter((ep) => !existingEpisodes.has(ep.guid));
  if (newEpisodes.length > 0) {
    console.log(`   New episodes added: ${newEpisodes.length}`);
    newEpisodes.forEach((ep) => {
      console.log(`   - [${ep.guid}] ${ep.title}`);
    });
  } else {
    console.log(`   No new episodes`);
  }
} catch (error) {
  console.error('❌ Error:', (error as Error).message);
  process.exit(1);
}
