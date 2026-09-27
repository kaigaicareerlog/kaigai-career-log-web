#!/usr/bin/env node
/**
 * One-off backfill: for episodes that have no city tag yet, search their full
 * transcript (not just the title/description) for an explicit city mention.
 * Episodes with no transcript, or where nothing explicit was found, are
 * printed as a list for a human to answer - this script never guesses.
 *
 * Usage: tsx scripts/backfill-city-tags.ts [--limit=N] [--delay=6000]
 */

import 'dotenv/config';
import fs from 'fs';
import { MAX_TAGS_PER_KIND } from '../src/constants/episodeVocabulary';
import { getLatestEpisodes } from '../src/utils/getLatestEpisodes';
import {
  readEpisodeMetaMap,
  writeEpisodeMetaMap,
} from '../src/utils/episodeMeta/episodeMetaFile';
import { findTagBySlug } from '../src/utils/episodeMeta/resolveTag';
import { getTranscriptJsonFilePath } from '../src/utils/getTranscriptJsonFilePath';
import {
  DEFAULT_GROQ_MODEL,
  GroqDailyLimitError,
} from '../src/utils/groq/chatCompletion';
import { findCityInTranscript } from '../src/utils/groq/findCityInTranscript';
import { createLogger } from '../src/utils/logger';
import type { PodcastEpisode } from '../src/types';

const logger = createLogger();
const DEFAULT_DELAY_MS = 6000;
// This Groq account is capped at 8000 tokens/minute regardless of the
// model's context window; Japanese transcript text runs ~0.73 tokens/char,
// so 6000 chars (~4.4k tokens) leaves headroom for the prompt + output.
const TRANSCRIPT_EXCERPT_MAX_CHARS = 6000;

function getOption(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv
    .find((arg) => arg.startsWith(prefix))
    ?.slice(prefix.length);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface NeedsAnswer {
  episode: PodcastEpisode;
  reason: string;
}

function loadTranscriptExcerpt(guid: string): string | null {
  const path = getTranscriptJsonFilePath(guid);
  if (!fs.existsSync(path)) return null;

  const transcript = JSON.parse(fs.readFileSync(path, 'utf-8'));
  const fullText: string = transcript.fullText ?? '';
  return fullText.length > TRANSCRIPT_EXCERPT_MAX_CHARS
    ? `${fullText.slice(0, TRANSCRIPT_EXCERPT_MAX_CHARS)}...`
    : fullText;
}

async function main(): Promise<void> {
  const limit = Number(getOption('limit')) || Infinity;
  const delayMs = Number(getOption('delay')) || DEFAULT_DELAY_MS;
  const model = getOption('model') ?? DEFAULT_GROQ_MODEL;

  const { episodes } = await getLatestEpisodes();
  const map = readEpisodeMetaMap();

  const targets = episodes
    .filter(
      (episode) => map[episode.guid] && map[episode.guid].cities.length === 0
    )
    .slice(0, limit);

  logger.info(`${targets.length} episode(s) have no city tag yet`);

  const needsAnswer: NeedsAnswer[] = [];
  let found = 0;

  for (const [index, episode] of targets.entries()) {
    const excerpt = loadTranscriptExcerpt(episode.guid);

    if (!excerpt) {
      needsAnswer.push({ episode, reason: '文字起こしがない' });
      continue;
    }

    logger.progress(index + 1, targets.length, 'Scanning transcripts');
    logger.processing(episode.title);

    try {
      const finding = await findCityInTranscript(
        {
          title: episode.title,
          description: episode.description,
          transcriptExcerpt: excerpt,
        },
        model
      );

      if (finding.citySlug) {
        const tag = findTagBySlug('city', finding.citySlug);
        map[episode.guid].cities = [finding.citySlug].slice(
          0,
          MAX_TAGS_PER_KIND.city
        );
        writeEpisodeMetaMap(map); // save after every episode
        found++;
        logger.success(`${tag?.label} — 「${finding.evidence ?? ''}」`, 1);
      } else if (finding.otherCity) {
        needsAnswer.push({
          episode,
          reason: `候補: 「${finding.otherCity}」（未登録の都市, 語彙に追加すべきか要確認）— 「${finding.evidence ?? ''}」`,
        });
      } else {
        needsAnswer.push({ episode, reason: '文字起こしからも判別できず' });
      }
    } catch (error) {
      if (error instanceof GroqDailyLimitError) {
        logger.warning(
          'Groq daily token limit reached. Progress is saved; run again later to continue.'
        );
        break;
      }
      needsAnswer.push({
        episode,
        reason: `エラー: ${(error as Error).message}`,
      });
    }

    if (index < targets.length - 1) await sleep(delayMs);
  }

  logger.summary({
    found,
    'needs a human answer': needsAnswer.length,
  });

  if (needsAnswer.length > 0) {
    logger.section('\n📋 わからなかったエピソード一覧:');
    for (const { episode, reason } of needsAnswer) {
      console.log(`- [${episode.guid}] ${episode.title}`);
      console.log(`    ${reason}`);
    }
  }
}

main().catch((error) => {
  logger.error((error as Error).message);
  process.exit(1);
});
