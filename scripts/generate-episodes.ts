/**
 * Script to generate episodes.json with additional metadata
 * Usage: node scripts/generate-episodes.ts <input-json-file> <output-episodes-file>
 */

import fs from "fs";
import path from "path";

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

interface EpisodeWithMetadata extends PodcastEpisode {
  spotifyUrl: string;
  youtubeUrl: string;
  applePodcastUrl: string;
  amazonMusicUrl: string;
}

interface EpisodesData {
  channel: {
    title: string;
    description: string;
    link: string;
    language: string;
    image: string;
  };
  episodes: EpisodeWithMetadata[];
  lastUpdated: string;
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
      const existingData: EpisodesData = JSON.parse(
        fs.readFileSync(latestFile, "utf-8")
      );
      existingData.episodes.forEach((episode) => {
        episodeMap.set(episode.guid, episode);
      });
      console.log(
        `Loaded ${episodeMap.size} existing episodes from ${path.basename(
          latestFile
        )}`
      );
    } catch (error) {
      console.warn(
        "Could not load existing episodes file:",
        (error as Error).message
      );
    }
  } else {
    console.log("No existing episodes files found, creating new file");
  }

  return episodeMap;
}

/**
 * Generate episodes with metadata
 */
function generateEpisodes(
  podcastData: PodcastData,
  existingEpisodes: Map<string, EpisodeWithMetadata>
): EpisodeWithMetadata[] {
  const episodes: EpisodeWithMetadata[] = podcastData.episodes.map(
    (episode) => {
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
          spotifyUrl: "",
          youtubeUrl: "",
          applePodcastUrl: "",
          amazonMusicUrl: "",
        };
        return newEpisode;
      }
    }
  );

  // Return episodes in the order from podcast data (latest first)
  return episodes;
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error(
    "Usage: node scripts/generate-episodes.ts <input-json-file> <output-episodes-file>"
  );
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];

try {
  console.log(`Reading podcast data from: ${inputFile}`);
  const podcastData: PodcastData = JSON.parse(
    fs.readFileSync(inputFile, "utf-8")
  );

  console.log(`Found ${podcastData.episodes.length} episodes in podcast data`);

  // Load existing episodes
  const existingEpisodes = loadExistingEpisodes(outputFile);

  // Generate episodes with metadata
  const episodes = generateEpisodes(podcastData, existingEpisodes);

  // Create output data
  const outputData: EpisodesData = {
    channel: podcastData.channel,
    episodes,
    lastUpdated: new Date().toISOString(),
  };

  console.log(`Writing episodes to: ${outputFile}`);
  fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2), "utf-8");

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
  console.error("❌ Error:", (error as Error).message);
  process.exit(1);
}
