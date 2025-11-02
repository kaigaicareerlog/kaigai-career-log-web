/**
 * Script to generate episodes.json with additional metadata
 * Reads RSS XML file directly and outputs just the episodes array
 * Usage: node scripts/generate-episodes.ts <input-xml-file> <output-episodes-file>
 */

import fs from 'fs';
import { parseRSSToEpisodes } from '../src/utils/rss/parseRSSToEpisodes';
import { loadExistingEpisodes } from '../src/utils/rss/loadExistingEpisodes';
import { generateEpisodes } from '../src/utils/rss/generateEpisodes';

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
  const rssEpisodes = parseRSSToEpisodes(xmlContent);

  console.log(`Found ${rssEpisodes.length} episodes in RSS feed`);

  const existingEpisodes = loadExistingEpisodes();
  const episodes = generateEpisodes(rssEpisodes, existingEpisodes);

  fs.writeFileSync(outputFile, JSON.stringify(episodes, null, 2), 'utf-8');

  console.log(`✅ Successfully generated ${episodes.length} episodes`);

  // Count new episodes
  const newEpisodes = episodes.filter((ep) => !existingEpisodes.has(ep.guid));
  if (newEpisodes.length > 0) {
    console.log(`   New episodes added: ${newEpisodes.length}`);
  } else {
    console.log(`   No new episodes`);
  }
} catch (error) {
  console.error('❌ Error:', (error as Error).message);
  process.exit(1);
}
