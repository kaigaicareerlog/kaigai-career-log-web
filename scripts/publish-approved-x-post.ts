#!/usr/bin/env node
/**
 * Publishes one approved new-episode announcement.
 * Runs only from the default-branch workflow. It does not evaluate issue text.
 *
 * Required environment (all supplied by the workflow, not by the issue body):
 *   ISSUE_NUMBER, ISSUE_BODY, SENDER_LOGIN, LABEL_NAME, APPROVAL_RUN_ID
 *   X_POST_APPROVER_LOGINS (empty means nobody can publish)
 *   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
 */

import 'dotenv/config';
import { getEpisodeByGuid } from '../src/utils/getEpisodeByGuid';
import { executeApprovedXPost } from '../src/utils/x/executeApprovedXPost';
import { createGitLedgerStore } from '../src/utils/x/gitLedgerStore';
import { createGhIssueGateway } from '../src/utils/x/githubIssueGateway';
import { publishTweet, readXCredentials } from '../src/utils/x/publishTweet';
import { redactSecrets } from '../src/utils/x/redactSecrets';
import { fetchShareImage } from '../src/utils/x/shareImage';
import { uploadShareImage } from '../src/utils/x/uploadShareImage';

const BRANCH_PATTERN = /^[A-Za-z0-9._/-]{1,100}$/;
const RUN_PATTERN = /^[A-Za-z0-9._-]{1,120}$/;

async function main(): Promise<void> {
  const issueNumber = Number(process.env.ISSUE_NUMBER);
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    throw new Error('ISSUE_NUMBER is invalid');
  }
  const runId = process.env.APPROVAL_RUN_ID ?? '';
  if (!RUN_PATTERN.test(runId)) throw new Error('APPROVAL_RUN_ID is invalid');
  const branch = process.env.DEFAULT_BRANCH || 'main';
  if (
    !BRANCH_PATTERN.test(branch) ||
    branch.startsWith('-') ||
    branch.includes('..')
  ) {
    throw new Error('DEFAULT_BRANCH is invalid');
  }

  const credentials = readXCredentials(process.env);
  const secrets = credentials ? Object.values(credentials) : [];
  const log = (message: string) => {
    console.log(redactSecrets(message, secrets));
  };
  const publisher = credentials
    ? {
        uploadImage: (bytes: Uint8Array) =>
          uploadShareImage({ bytes, credentials }),
        postMain: (text: string, mediaId: string) =>
          publishTweet({ text, credentials, mediaIds: [mediaId] }),
        postReply: (text: string, inReplyToTweetId: string) =>
          publishTweet({
            text,
            credentials,
            replyToTweetId: inReplyToTweetId,
          }),
      }
    : null;

  const result = await executeApprovedXPost({
    issueNumber,
    issueBody: process.env.ISSUE_BODY ?? '',
    labelName: process.env.LABEL_NAME ?? '',
    senderLogin: process.env.SENDER_LOGIN ?? '',
    assigneeLogin: process.env.ASSIGNEE_LOGIN || null,
    allowlistRaw: process.env.X_POST_APPROVER_LOGINS,
    runId,
    now: () => new Date().toISOString(),
    loadEpisode: (guid) => getEpisodeByGuid({ guid }),
    loadShareImage: (guid) => fetchShareImage({ guid }),
    ledger: createGitLedgerStore({
      cwd: process.cwd(),
      branch,
      authorName: 'github-actions[bot]',
      authorEmail: 'github-actions[bot]@users.noreply.github.com',
    }),
    publisher,
    issues: createGhIssueGateway(),
    log,
  });
  log(`Approval run finished: ${result.outcome}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'unknown error';
  console.error(
    redactSecrets(message, Object.values(readXCredentials(process.env) ?? {}))
  );
  process.exit(1);
});
