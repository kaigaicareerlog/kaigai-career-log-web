/**
 * Print, as a JSON array, the GUIDs of episodes that have no transcript yet,
 * newest first. Used by the daily transcription workflow.
 *
 * Usage: tsx scripts/list-untranscribed.ts [--exclude=<guid>,<guid>]
 *   --exclude   skip these (e.g. episodes with an open transcript PR)
 */

import fs from 'fs';
import { findLatestEpisodes } from '../src/utils/findLatestEpisodes';
import { getTranscriptJsonFilePath } from '../src/utils/getTranscriptJsonFilePath';

const excludeArg = process.argv
  .find((arg) => arg.startsWith('--exclude='))
  ?.slice('--exclude='.length);
const excluded = new Set(excludeArg ? excludeArg.split(',') : []);

const guids = findLatestEpisodes()
  .map((episode) => episode.guid)
  .filter(
    (guid) =>
      !excluded.has(guid) && !fs.existsSync(getTranscriptJsonFilePath(guid))
  );

console.log(JSON.stringify(guids));
