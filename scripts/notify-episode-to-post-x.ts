#!/usr/bin/env node
/**
 * Notifies about a new episode to post to X by opening a GitHub issue with
 * the tweet text ready to copy (and a one-click "open X with this pre-filled"
 * link when it's short enough), instead of posting directly - X's API now
 * requires paid pay-per-use credits.
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
import { buildTweetIntentUrl } from '../src/utils/x/buildTweetIntentUrl';
import { formatFullEpisodeXPost } from '../src/utils/x/formatFullEpisodeXPost';
import { markNewEpisodeIntroPostedToX } from '../src/utils/x/markNewEpisodeIntroPostedToX';

const logger = createLogger();
const ISSUE_TITLE_MAX_CHARS = 80;

/**
 * Builds the GitHub issue body: the episode link, an optional one-click
 * "open X pre-filled" link, and the full post text in a single copy-able
 * code block.
 */
function buildIssueBody(postText: string, episodePageUrl: string): string {
  const intentUrl = buildTweetIntentUrl(postText);

  return [
    `**エピソードページ:** ${episodePageUrl}`,
    '',
    ...(intentUrl
      ? [`[✏️ この内容でXの投稿画面を開く](${intentUrl})`, '']
      : []),
    '```',
    postText,
    '```',
    '',
    '---',
    '投稿したらこのIssueをクローズしてください。',
  ].join('\n');
}

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

  const postText = formatFullEpisodeXPost(episode, hosts);
  const episodePageUrl = `${SITE_URL}/episodes/${episode.guid}/`;
  const title = `📣 Xに投稿: ${truncateText(episode.title, ISSUE_TITLE_MAX_CHARS)}`;
  const body = buildIssueBody(postText, episodePageUrl);

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
