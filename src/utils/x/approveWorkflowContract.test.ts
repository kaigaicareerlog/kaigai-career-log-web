import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { describe, it } from 'node:test';
import { X_POST_HOSTS } from '../../constants/xPost';

const root = path.resolve(import.meta.dirname, '../../..');

describe('X approval workflow contract', () => {
  const workflow = fs.readFileSync(
    path.join(root, '.github/workflows/approve-x-episode-post.yml'),
    'utf8'
  );
  const rss = fs.readFileSync(
    path.join(root, '.github/workflows/update-rss.yml'),
    'utf8'
  );

  it('runs trusted default-branch code and keeps secrets off untrusted events', () => {
    assert.equal(/^\s*pull_request_target:/m.test(workflow), false);
    assert.equal(
      workflow.includes('ref: ${{ github.event.repository.default_branch }}'),
      true
    );
    assert.match(workflow, /cancel-in-progress:\s*false/);
    assert.equal(
      workflow.includes("github.event.label.name == 'x-post-approved'"),
      true
    );
    assert.equal(workflow.includes('vars.X_POST_APPROVER_LOGINS'), true);
    for (const name of [
      'X_API_KEY',
      'X_API_SECRET',
      'X_ACCESS_TOKEN',
      'X_ACCESS_TOKEN_SECRET',
    ]) {
      assert.equal(workflow.includes(`secrets.${name}`), true);
    }
  });

  it('keeps the daily job on issue creation rather than auto-posting', () => {
    assert.equal(rss.includes(X_POST_HOSTS), true);
    assert.equal(rss.includes('src/data/xPostLedger.json'), true);
    assert.equal(
      rss.includes('npx tsx scripts/auto-post-episode-to-x.ts'),
      false
    );
  });
});
