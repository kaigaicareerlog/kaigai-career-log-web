import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { describe, it } from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..');

describe('Create X approval issue workflow', () => {
  const workflow = fs.readFileSync(
    path.join(root, '.github/workflows/create-x-approval-issue.yml'),
    'utf8'
  );
  const script = fs.readFileSync(
    path.join(root, 'scripts/create-manual-approval-issue.ts'),
    'utf8'
  );

  it('passes the guid only as data and does not post or label', () => {
    assert.equal(/^\s*pull_request_target:/m.test(workflow), false);
    assert.equal(workflow.includes('workflow_dispatch:'), true);
    assert.equal((workflow.match(/inputs\.guid/g) ?? []).length, 1);
    assert.match(workflow, /EPISODE_GUID:\s*\$\{\{\s*inputs\.guid\s*\}\}/);
    assert.equal(
      workflow.includes('npx tsx scripts/create-manual-approval-issue.ts'),
      true
    );
    assert.equal(workflow.includes('src/data/xPostLedger.json'), true);
    assert.equal(workflow.includes('secrets.X_API_KEY'), false);
    assert.equal(workflow.includes('auto-post-episode-to-x'), false);
    assert.equal(workflow.includes('publish-approved-x-post'), false);
    assert.equal(workflow.includes('--add-label'), false);
    assert.equal(workflow.includes('x-post-approved'), false);

    assert.equal(script.includes('ryonryon'), true);
    assert.equal(script.includes('execFileSync'), true);
    assert.equal(script.includes('publishTweet'), false);
    assert.equal(script.includes('uploadShareImage'), false);
    assert.equal(script.includes('x-post-approved'), false);
    assert.equal(script.includes('markNewEpisodeIntroPostedToX'), false);
  });
});
