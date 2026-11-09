#!/usr/bin/env node
/**
 * Opens a GitHub issue for one new episode so an allowlisted person can approve
 * the X announcement. This does not post to X.
 *
 * Usage: tsx scripts/notify-episode-to-post-x.ts <hosts> [assignee]
 *
 * `hosts` must equal X_POST_HOSTS. The approval workflow regenerates with that
 * constant, so a different value would never match.
 */

import 'dotenv/config';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { findLatestEpisodesFile } from '../src/utils/findLatestEpisodesFile';
import { getLatestEpisodeToTweet } from '../src/utils/getLatestEpisodeToTweet';
import { createLogger } from '../src/utils/logger';
import { planEpisodeIssueNotification } from '../src/utils/x/planEpisodeIssueNotification';
import { parseCreatedIssueNumber } from '../src/utils/x/parseCreatedIssueNumber';
import { markNewEpisodeIntroPostedToX } from '../src/utils/x/markNewEpisodeIntroPostedToX';
import {
  readLedgerFile,
  writeLedgerFile,
  xPostLedgerFilePath,
} from '../src/utils/x/xPostLedgerFile';
import { withAwaitingApprovalEntry } from '../src/utils/x/xPostLedger';

const logger = createLogger();

function main(): void {
  const [hosts, assignee] = process.argv.slice(2);
  if (!hosts) {
    logger.error(
      'Usage: tsx scripts/notify-episode-to-post-x.ts <hosts> [assignee]'
    );
    process.exit(1);
  }

  const episode = getLatestEpisodeToTweet();
  const ledgerPath = xPostLedgerFilePath(process.cwd());
  const ledger = readLedgerFile(ledgerPath);
  const plan = planEpisodeIssueNotification({
    episode,
    hosts,
    ledger,
  });

  if (plan.action === 'none') {
    logger.success('No episodes need an X approval issue');
    return;
  }
  if (plan.action === 'invalid_hosts') {
    logger.error('Host list does not match the canonical X post hosts');
    process.exit(1);
  }

  const rssDir = path.join(process.cwd(), 'public', 'rss');
  const episodesFile = findLatestEpisodesFile(rssDir);
  if (plan.action === 'mark_flag_only') {
    markNewEpisodeIntroPostedToX(episodesFile, plan.guid);
    logger.success('Episode already has an approval record; flag refreshed');
    return;
  }

  logger.info(`Found episode to review: ${episode?.title ?? plan.guid}`);
  const issueUrl = createIssue(plan.title, plan.body, assignee);
  const issueNumber = parseCreatedIssueNumber(issueUrl);
  if (issueNumber === null) {
    logger.error('Could not parse the created issue number');
    process.exit(1);
  }
  logger.success(`Issue created: ${issueUrl.trim()}`);

  const next = withAwaitingApprovalEntry(ledger, {
    guid: plan.guid,
    issueNumber,
    mainText: plan.mainText,
    replyText: plan.replyText,
    updatedAt: new Date().toISOString(),
  });
  writeLedgerFile(ledgerPath, next);
  markNewEpisodeIntroPostedToX(episodesFile, plan.guid);
  logger.success('Recorded the approval issue. It is not published yet.');
}

function createIssue(
  title: string,
  body: string,
  assignee: string | undefined
): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'x-post-issue-'));
  const bodyFile = path.join(directory, 'body.md');
  fs.writeFileSync(bodyFile, body, 'utf8');
  try {
    const args = ['issue', 'create', '--title', title, '--body-file', bodyFile];
    if (assignee) args.push('--assignee', assignee);
    return execFileSync('gh', args, { encoding: 'utf8' });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  logger.error((error as Error).message);
  process.exit(1);
}
