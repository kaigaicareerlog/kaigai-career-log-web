import { getLatestEpisodes } from '../src/utils/getLatestEpisodes';
import { getTranscriptByGuid } from '../src/utils/getTranscriptByGuid';
import {
  readEpisodeMetaMap,
  writeEpisodeMetaMap,
} from '../src/utils/episodeMeta/episodeMetaFile';
import { formatEpisodeMetaReport } from '../src/utils/episodeMeta/formatEpisodeMetaReport';
import {
  DEFAULT_GROQ_MODEL,
  GroqDailyLimitError,
} from '../src/utils/groq/chatCompletion';
import { extractEpisodeMeta } from '../src/utils/groq/extractEpisodeMeta';
import { createLogger } from '../src/utils/logger';
import type { EpisodeMeta, PodcastEpisode } from '../src/types';

const logger = createLogger();

const MAX_CONSECUTIVE_FAILURES = 3;
const DEFAULT_DELAY_MS = 6000;

/**
 * Tags episodes with guest info + tags using Groq and saves them to
 * src/data/episodeMeta.json. Episodes that already have metadata are skipped,
 * so it is safe to run repeatedly (e.g. weekly, or after a daily-quota stop).
 *
 * Usage:
 *   tsx scripts/tag-episodes.ts                 tag all untagged episodes
 *   tsx scripts/tag-episodes.ts --limit=5       tag at most 5
 *   tsx scripts/tag-episodes.ts --guid=<guid> --force   redo one episode
 *   tsx scripts/tag-episodes.ts --report        print the review report
 *   tsx scripts/tag-episodes.ts --approve       mark all entries as reviewed
 */

function getOption(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv
    .find((arg) => arg.startsWith(prefix))
    ?.slice(prefix.length);
}
const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Highlights (if a transcript exists) give the model a bit more context */
function loadHighlights(guid: string): string[] {
  try {
    const transcript = getTranscriptByGuid(guid);
    return [
      transcript.highlight1,
      transcript.highlight2,
      transcript.highlight3,
    ].filter((h): h is string => Boolean(h));
  } catch {
    return [];
  }
}

/**
 * Reviewed entries are protected: they are only redone when a specific
 * --guid is given together with --force.
 */
function shouldTag(
  existing: EpisodeMeta | undefined,
  force: boolean,
  explicitGuid: boolean
): boolean {
  if (!existing) return true;
  if (existing.reviewed) return force && explicitGuid;
  return force;
}

async function main(): Promise<void> {
  const { episodes } = await getLatestEpisodes();
  const map = readEpisodeMetaMap();
  const guid = getOption('guid');

  if (hasFlag('report')) {
    for (const episode of episodes) {
      const meta = map[episode.guid];
      if (meta) console.log(`\n${formatEpisodeMetaReport(episode, meta)}`);
    }
    logger.summary({
      episodes: episodes.length,
      tagged: Object.keys(map).length,
    });
    return;
  }

  if (hasFlag('approve')) {
    const guids = guid ? [guid] : Object.keys(map);
    guids.forEach((g) => map[g] && (map[g].reviewed = true));
    writeEpisodeMetaMap(map);
    logger.success(`Marked ${guids.length} episode(s) as reviewed`);
    return;
  }

  const force = hasFlag('force');
  const limit = Number(getOption('limit')) || Infinity;
  const delayMs = Number(getOption('delay')) || DEFAULT_DELAY_MS;
  const model = getOption('model') ?? DEFAULT_GROQ_MODEL;

  const targets: PodcastEpisode[] = episodes
    .filter((episode) => !guid || episode.guid === guid)
    .filter((episode) => shouldTag(map[episode.guid], force, Boolean(guid)))
    .slice(0, limit);

  if (targets.length === 0) {
    logger.success('Nothing to tag: all episodes already have metadata');
    return;
  }

  logger.info(`Tagging ${targets.length} episode(s) with ${model}`);

  let done = 0;
  let failures = 0;
  let consecutiveFailures = 0;

  for (const [index, episode] of targets.entries()) {
    logger.progress(index + 1, targets.length, 'Tagging');
    logger.processing(episode.title);

    try {
      const { meta, warnings } = await extractEpisodeMeta(
        {
          title: episode.title,
          description: episode.description,
          highlights: loadHighlights(episode.guid),
        },
        model
      );

      map[episode.guid] = meta;
      writeEpisodeMetaMap(map); // save after every episode: no work is lost
      done++;
      consecutiveFailures = 0;

      warnings.forEach((warning) => logger.warning(warning, 2));
    } catch (error) {
      if (error instanceof GroqDailyLimitError) {
        logger.warning(
          'Groq daily token limit reached. Progress is saved; run again later to continue.'
        );
        break;
      }
      failures++;
      consecutiveFailures++;
      logger.error(`${(error as Error).message}`, 2);
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        logger.error('Too many failures in a row, stopping.');
        break;
      }
    }

    if (index < targets.length - 1) await sleep(delayMs);
  }

  logger.summary({
    tagged: done,
    failed: failures,
    remaining: targets.length - done - failures,
  });
  logger.info('Review with: npm run tag-episodes -- --report');

  if (failures > 0) process.exit(1);
}

main().catch((error) => {
  logger.error((error as Error).message);
  process.exit(1);
});
