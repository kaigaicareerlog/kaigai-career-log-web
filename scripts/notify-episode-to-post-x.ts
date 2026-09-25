#!/usr/bin/env node
/**
 * Notifies about a new episode to post to X by opening a GitHub issue with
 * the tweet text ready to copy (main tweet and reply each in their own code
 * block, plus a one-click "open X with the main tweet pre-filled" link),
 * instead of posting directly - X's API now requires paid pay-per-use
 * credits.
 *
 * Usage: tsx scripts/notify-episode-to-post-x.ts <hosts> [assignee]
 *
 * Requires the `gh` CLI to be authenticated (GH_TOKEN env var in CI).
 */

import 'dotenv/config';
import { execFileSync } from 'child_process';
import path from 'path';
import { SITE_URL } from '../src/constants/site';
import { findLatestEpisodesFile } from '../src/utils/findLatestEpisodesFile';
import { getLatestEpisodeToTweet } from '../src/utils/getLatestEpisodeToTweet';
import { createLogger } from '../src/utils/logger';
import { truncateText } from '../src/utils/seo';
import { buildEpisodePostIssueBody } from '../src/utils/x/buildEpisodePostIssueBody';
import { formatNewEpisodeMainTweet } from '../src/utils/x/formatNewEpisodeMainTweet';
import { formatNewEpisodeUrlsTweet } from '../src/utils/x/formatNewEpisodeUrlsTweet';
import { markNewEpisodeIntroPostedToX } from '../src/utils/x/markNewEpisodeIntroPostedToX';

const logger = createLogger();
const ISSUE_TITLE_MAX_CHARS = 80;

async function main(): Promise<void> {
  const [hosts, assignee] = process.argv.slice(2);

  if (!hosts) {
    logger.error(
      'Usage: tsx scripts/notify-episode-to-post-x.ts <hosts> [assignee]'
    );
    process.exit(1);
  }

  const episode = getLatestEpisodeToTweet();

  if (!episode) {
    logger.success('No episodes need to be posted to X');
    return;
  }

  logger.info(`Found episode to post: ${episode.title}`);

  const title = `📣 Xに投稿: ${truncateText(episode.title, ISSUE_TITLE_MAX_CHARS)}`;
  const body = buildEpisodePostIssueBody({
    episodePageUrl: `${SITE_URL}/episodes/${episode.guid}/`,
    mainTweetText: formatNewEpisodeMainTweet(episode, hosts),
    urlsTweetText: formatNewEpisodeUrlsTweet(episode),
  });

  const args = ['issue', 'create', '--title', title, '--body', body];
  if (assignee) args.push('--assignee', assignee);

  logger.info('Creating GitHub issue...');
  const issueUrl = execFileSync('gh', args, { encoding: 'utf-8' }).trim();
  logger.success(`Issue created: ${issueUrl}`);

  const rssDir = path.join(process.cwd(), 'public', 'rss');
  const filePath = findLatestEpisodesFile(rssDir);
  markNewEpisodeIntroPostedToX(filePath, episode.guid);
  logger.success('Marked episode as notified (will not notify again)');
}

main().catch((error) => {
  logger.error((error as Error).message);
  process.exit(1);
});
