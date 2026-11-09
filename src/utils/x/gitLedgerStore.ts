import { execFileSync } from 'child_process';
import { X_POST_LEDGER_PATH } from '../../constants/xPost';
import type { LedgerStore } from './executeApprovedXPost';
import { readLedgerFile, writeLedgerFile } from './xPostLedgerFile';
import type { XPostLedger } from './xPostLedger';

export interface GitLedgerStoreOptions {
  cwd: string;
  branch: string;
  authorName: string;
  authorEmail: string;
  remote?: string;
}

const BRANCH_PATTERN = /^[A-Za-z0-9._/-]{1,100}$/;

/**
 * Ledger store that publishes a revision only when the remote branch is unchanged.
 * A lost race returns false and does not leave the failed commit in place.
 */
export function createGitLedgerStore(
  options: GitLedgerStoreOptions
): LedgerStore {
  const remote = options.remote ?? 'origin';
  assertBranch(options.branch);
  assertToken(remote, 'remote');
  const filePath = `${options.cwd.replace(/\/$/, '')}/${X_POST_LEDGER_PATH}`;

  return {
    read() {
      return readLedgerFile(filePath);
    },
    compareAndSwap(expectedRevision, next) {
      if (next.revision !== expectedRevision + 1) return false;
      let wrote = false;
      let committed = false;
      try {
        git(options.cwd, ['fetch', remote, options.branch]);
        const head = git(options.cwd, ['rev-parse', 'HEAD']).trim();
        const upstream = git(options.cwd, [
          'rev-parse',
          `${remote}/${options.branch}`,
        ]).trim();
        if (head !== upstream) return false;
        if (git(options.cwd, ['status', '--porcelain']).trim() !== '')
          return false;

        const current = readLedgerFile(filePath);
        if (current.revision !== expectedRevision) return false;
        writeLedgerFile(filePath, next);
        wrote = true;
        git(options.cwd, ['add', '--', X_POST_LEDGER_PATH]);
        git(options.cwd, [
          '-c',
          `user.email=${options.authorEmail}`,
          '-c',
          `user.name=${options.authorName}`,
          '-c',
          'commit.gpgsign=false',
          'commit',
          '-m',
          'chore: record X post approval state',
        ]);
        committed = true;
        git(options.cwd, ['push', remote, `HEAD:${options.branch}`]);
        return sameRevision(readLedgerFile(filePath), next);
      } catch {
        restoreFailedAttempt(options.cwd, committed, wrote);
        return false;
      }
    },
  };
}

function sameRevision(landed: XPostLedger, next: XPostLedger): boolean {
  return landed.revision === next.revision;
}

function restoreFailedAttempt(
  cwd: string,
  committed: boolean,
  wrote: boolean
): void {
  try {
    if (committed) git(cwd, ['reset', '--mixed', 'HEAD~1']);
    if (committed || wrote) git(cwd, ['checkout', '--', X_POST_LEDGER_PATH]);
  } catch {
    // The caller treats the swap as lost and does not post.
  }
}

function assertBranch(branch: string): void {
  if (
    !BRANCH_PATTERN.test(branch) ||
    branch.startsWith('-') ||
    branch.includes('..')
  ) {
    throw new Error('Invalid git branch');
  }
}

function assertToken(value: string, label: string): void {
  if (!/^[A-Za-z0-9._-]+$/.test(value)) throw new Error(`Invalid git ${label}`);
}

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}
