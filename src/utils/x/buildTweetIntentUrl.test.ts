import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildTweetIntentUrl } from './buildTweetIntentUrl';

describe('buildTweetIntentUrl', () => {
  it('builds a twitter.com intent link with the text URL-encoded', () => {
    const url = buildTweetIntentUrl('こんにちは #test');
    assert.equal(
      url,
      'https://twitter.com/intent/tweet?text=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF%20%23test'
    );
  });

  it('returns null when the text is longer than a single tweet', () => {
    assert.equal(buildTweetIntentUrl('a'.repeat(281)), null);
  });

  it('accepts text at exactly the limit', () => {
    assert.notEqual(buildTweetIntentUrl('a'.repeat(280)), null);
  });
});
