import { getLatestEpisodes } from '../src/utils/getLatestEpisodes';
import { getTranscriptByGuid } from '../src/utils/getTranscriptByGuid';
import {
  readEpisodeMetaMap,
  writeEpisodeMetaMap,
} from '../src/utils/episodeMeta/episodeMetaFile';
import { formatEpisodeMetaReport } from '../src/utils/episodeMeta/formatEpisodeMetaReport';
import { addPlaceTags } from '../src/utils/episodeMeta/placeTagsFile';
import { sharePartnerTags } from '../src/utils/episodeMeta/sharePartnerTags';
import {
  DEFAULT_GROQ_MODEL,
  GroqDailyLimitError,
} from '../src/utils/groq/chatCompletion';
import { extractEpisodeMeta } from '../src/utils/groq/extractEpisodeMeta';
import { createLogger } from '../src/utils/logger';
import { openingLines } from '../src/utils/transcript/buildSpeakerExcerpt';
import type { EpisodeMeta, EpisodeMetaMap, PodcastEpisode } from '../src/types';

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
 *   tsx scripts/tag-episodes.ts --guid=<guid> --force --keep-reviewed
 *                                   redo one episode unless a human reviewed it
 *                                   (used after transcription)
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

// Opening of the transcript sent with the title and description. The Groq
// free tier allows 8,000 tokens/minute; the prompt is ~1,400 tokens and the
// response budget 2,000, and Japanese runs ~0.73 tokens/char
const TRANSCRIPT_OPENING_MAX_CHARS = 3000;

/** Where guests introduce themselves (job, company, city), if transcribed */
function loadTranscriptOpening(guid: string): string | undefined {
  try {
    const lines = openingLines(
      getTranscriptByGuid(guid).utterances,
      TRANSCRIPT_OPENING_MAX_CHARS
    );
    return lines.length > 0 ? lines.join('\n') : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Reviewed entries are protected: they are only redone when a specific
 * --guid is given together with --force.
 */
function shouldTag(
  existing: EpisodeMeta | undefined,
  force: boolean,
  explicitGuid: boolean,
  keepReviewed: boolean
): boolean {
  if (!existing) return true;
  if (existing.reviewed) return force && explicitGuid && !keepReviewed;
  return force;
}

/**
 * Copies city, country and the returnee tag between the two halves of a
 * two-part interview and saves the result. Runs after tagging, and also when
 * there is nothing to tag, so a half tagged earlier still gets filled in.
 */
function shareTagsBetweenParts(
  episodes: readonly PodcastEpisode[],
  map: EpisodeMetaMap
): void {
  const { map: shared, changed } = sharePartnerTags(episodes, map);
  if (changed.length === 0) return;

  writeEpisodeMetaMap(shared);
  logger.info(
    `Shared city/country/returnee tags with the other half of ${changed.length} episode(s):`
  );
  changed.forEach((changedGuid) => {
    const title = episodes.find((e) => e.guid === changedGuid)?.title;
    logger.processing(title ?? changedGuid, 2);
  });
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
  const keepReviewed = hasFlag('keep-reviewed');
  const limit = Number(getOption('limit')) || Infinity;
  const delayMs = Number(getOption('delay')) || DEFAULT_DELAY_MS;
  const model = getOption('model') ?? DEFAULT_GROQ_MODEL;

  const targets: PodcastEpisode[] = episodes
    .filter((episode) => !guid || episode.guid === guid)
    .filter((episode) =>
      shouldTag(map[episode.guid], force, Boolean(guid), keepReviewed)
    )
    .slice(0, limit);

  if (targets.length === 0) {
    logger.success('Nothing to tag: all episodes already have metadata');
    shareTagsBetweenParts(episodes, map);
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
      const { meta, warnings, newPlaces } = await extractEpisodeMeta(
        {
          title: episode.title,
          description: episode.description,
          highlights: loadHighlights(episode.guid),
          transcriptOpening: loadTranscriptOpening(episode.guid),
        },
        model
      );

      // Countries/cities not in the vocabulary yet become new tags (and map
      // pins) right away; they show up in the report for a human to check
      addPlaceTags(newPlaces).forEach((place) =>
        logger.info(
          `New ${place.kind} tag: ${place.tag.label} (${place.tag.slug})`,
          2
        )
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

  shareTagsBetweenParts(episodes, map);

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
