import assert from 'node:assert/strict';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it } from 'node:test';
import { X_POST_LEDGER_PATH } from '../../constants/xPost';
import { createGitLedgerStore } from './gitLedgerStore';
import { emptyXPostLedger, withAwaitingApprovalEntry } from './xPostLedger';
import { writeLedgerFile } from './xPostLedgerFile';

function git(cwd: string, args: string[]): void {
  execFileSync('git', ['-c', 'commit.gpgsign=false', ...args], {
    cwd,
    stdio: 'pipe',
  });
}

function configure(directory: string): void {
  git(directory, ['config', 'user.email', 'test@example.com']);
  git(directory, ['config', 'user.name', 'Test']);
}

describe('createGitLedgerStore', () => {
  it('rejects a clone that is no longer at the remote revision', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'x-ledger-'));
    const origin = path.join(root, 'origin.git');
    const first = path.join(root, 'first');
    const second = path.join(root, 'second');
    execFileSync('git', ['init', '--bare', '-b', 'main', origin], {
      stdio: 'pipe',
    });
    fs.mkdirSync(first);
    git(first, ['init', '-b', 'main']);
    configure(first);
    const initial = emptyXPostLedger();
    const ledgerPath = path.join(first, X_POST_LEDGER_PATH);
    fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
    writeLedgerFile(ledgerPath, initial);
    git(first, ['add', '--', X_POST_LEDGER_PATH]);
    git(first, ['commit', '-m', 'ledger']);
    git(first, ['remote', 'add', 'origin', origin]);
    git(first, ['push', 'origin', 'HEAD:main']);
    execFileSync('git', ['clone', origin, second], { stdio: 'pipe' });
    configure(second);

    const winner = createGitLedgerStore({
      cwd: first,
      branch: 'main',
      authorName: 'Test',
      authorEmail: 'test@example.com',
    });
    const next = withAwaitingApprovalEntry(initial, {
      guid: '11111111-1111-4111-8111-111111111111',
      issueNumber: 1,
      mainText: 'main',
      replyText: 'reply',
      updatedAt: '2026-11-08T00:00:00.000Z',
    });
    assert.equal(winner.compareAndSwap(0, next), true);

    const loser = createGitLedgerStore({
      cwd: second,
      branch: 'main',
      authorName: 'Test',
      authorEmail: 'test@example.com',
    });
    const other = withAwaitingApprovalEntry(initial, {
      guid: '22222222-2222-4222-8222-222222222222',
      issueNumber: 2,
      mainText: 'other',
      replyText: 'reply',
      updatedAt: '2026-11-08T00:00:00.000Z',
    });
    assert.equal(loser.compareAndSwap(0, other), false);
    assert.equal(loser.read().revision, 0);
    assert.equal(
      winner.read().entries[0]?.guid,
      '11111111-1111-4111-8111-111111111111'
    );
  });
});
