import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ghCommentArgs, ghReplaceBodyArgs } from './githubIssueGateway';

describe('github issue arguments', () => {
  it('keeps issue text out of the argument list', () => {
    const body = '$(rm -rf /)\nmain tweet';
    const args = ghCommentArgs(70, '/tmp/x-post-issue/body.md');
    assert.deepEqual(args, [
      'issue',
      'comment',
      '70',
      '--body-file',
      '/tmp/x-post-issue/body.md',
    ]);
    assert.equal(
      args.some((arg) => arg.includes(body)),
      false
    );
    assert.deepEqual(
      ghReplaceBodyArgs(70, '/tmp/x-post-issue/body.md').slice(0, 3),
      ['issue', 'edit', '70']
    );
  });

  it('rejects an issue number or file that could change the command', () => {
    assert.throws(() => ghCommentArgs(0, '/tmp/body.md'));
    assert.throws(() => ghCommentArgs(70, '-body'));
  });
});
