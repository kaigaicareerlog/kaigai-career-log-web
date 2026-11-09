#!/usr/bin/env node
/**
 * Opens one new-format X approval issue for an episode chosen by GUID.
 * Does not post to X, upload media, label the issue, or edit other issues.
 *
 * Environment:
 *   EPISODE_GUID  UUID of the episode. Read as data, never passed to a shell.
 */

import 'dotenv/config';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getEpisodeByGuid } from '../src/utils/getEpisodeByGuid';
import { createLogger } from '../src/utils/logger';
import { parseCreatedIssueNumber } from '../src/utils/x/parseCreatedIssueNumber';
import {
  describeManualApprovalRefusal,
  normalizeEpisodeGuid,
  planManualApprovalIssue,
} from '../src/utils/x/planManualApprovalIssue';
import { withAwaitingApprovalEntry } from '../src/utils/x/xPostLedger';
import {
  readLedgerFile,
  writeLedgerFile,
  xPostLedgerFilePath,
} from '../src/utils/x/xPostLedgerFile';

const ASSIGNEE = 'ryonryon';
const logger = createLogger();

function main(): void {
  const rawGuid = process.env.EPISODE_GUID ?? '';
  const guid = normalizeEpisodeGuid(rawGuid);
  const ledgerPath = xPostLedgerFilePath(process.cwd());
  const ledger = readLedgerFile(ledgerPath);
  const plan = planManualApprovalIssue({
    guid: rawGuid,
    episode: guid ? getEpisodeByGuid({ guid }) : null,
    ledger,
  });

  if (plan.action !== 'create') {
    logger.error(describeManualApprovalRefusal(plan));
    process.exit(1);
  }

  const issueUrl = createIssue(plan.title, plan.body);
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
  logger.success(
    'Recorded one awaiting_approval row. Nothing was posted to X.'
  );
}

function createIssue(title: string, body: string): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'x-approval-issue-'));
  const bodyFile = path.join(directory, 'body.md');
  fs.writeFileSync(bodyFile, body, 'utf8');
  try {
    return execFileSync(
      'gh',
      [
        'issue',
        'create',
        '--title',
        title,
        '--body-file',
        bodyFile,
        '--assignee',
        ASSIGNEE,
      ],
      { encoding: 'utf8' }
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  logger.error(error instanceof Error ? error.message : 'unknown error');
  process.exit(1);
}
