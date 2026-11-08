import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { X_POST_APPROVAL_LABEL } from '../../constants/xPost';

export interface IssueGateway {
  comment(issueNumber: number, body: string): void;
  close(issueNumber: number): void;
  removeLabel(issueNumber: number, label: string): void;
  replaceBody(issueNumber: number, body: string): void;
}

/**
 * Checks an issue number before it is placed in a gh argument list.
 */
export function assertIssueNumber(issueNumber: number): void {
  if (
    !Number.isInteger(issueNumber) ||
    issueNumber <= 0 ||
    issueNumber > 1_000_000_000
  ) {
    throw new Error('Invalid issue number');
  }
}

/**
 * gh argv for a comment. The body stays in a file, not in the argument list.
 */
export function ghCommentArgs(issueNumber: number, bodyFile: string): string[] {
  assertIssueNumber(issueNumber);
  assertBodyFile(bodyFile);
  return ['issue', 'comment', String(issueNumber), '--body-file', bodyFile];
}

/**
 * gh argv that replaces an issue body from a file.
 */
export function ghReplaceBodyArgs(
  issueNumber: number,
  bodyFile: string
): string[] {
  assertIssueNumber(issueNumber);
  assertBodyFile(bodyFile);
  return ['issue', 'edit', String(issueNumber), '--body-file', bodyFile];
}

/**
 * Gateway that talks to gh without a shell.
 */
export function createGhIssueGateway(exec: GhExec = defaultExec): IssueGateway {
  return {
    comment(issueNumber, body) {
      withBodyFile(body, (bodyFile) => {
        exec('gh', ghCommentArgs(issueNumber, bodyFile));
      });
    },
    close(issueNumber) {
      assertIssueNumber(issueNumber);
      exec('gh', [
        'issue',
        'close',
        String(issueNumber),
        '--reason',
        'completed',
      ]);
    },
    removeLabel(issueNumber, label) {
      assertIssueNumber(issueNumber);
      if (label !== X_POST_APPROVAL_LABEL) {
        throw new Error('Refusing to remove an unexpected label');
      }
      exec('gh', [
        'issue',
        'edit',
        String(issueNumber),
        '--remove-label',
        X_POST_APPROVAL_LABEL,
      ]);
    },
    replaceBody(issueNumber, body) {
      withBodyFile(body, (bodyFile) => {
        exec('gh', ghReplaceBodyArgs(issueNumber, bodyFile));
      });
    },
  };
}

type GhExec = (file: string, args: string[]) => void;

function defaultExec(file: string, args: string[]): void {
  execFileSync(file, args, { encoding: 'utf8', stdio: 'pipe' });
}

function assertBodyFile(bodyFile: string): void {
  if (
    bodyFile.length === 0 ||
    bodyFile.startsWith('-') ||
    bodyFile.includes('\0')
  ) {
    throw new Error('Invalid body file');
  }
}

function withBodyFile(body: string, run: (bodyFile: string) => void): void {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'x-post-issue-'));
  const bodyFile = path.join(directory, 'body.md');
  fs.writeFileSync(bodyFile, body, 'utf8');
  try {
    run(bodyFile);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
