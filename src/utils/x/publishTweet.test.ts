import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  classifyTweetResponse,
  publishTweet,
  readXCredentials,
  type XApiCredentials,
} from './publishTweet';
import { redactSecrets } from './redactSecrets';

const credentials: XApiCredentials = {
  apiKey: 'test-api-key',
  apiSecret: 'test-api-secret',
  accessToken: 'test-access-token',
  accessTokenSecret: 'test-access-token-secret',
};

describe('classifyTweetResponse', () => {
  it('accepts only a numeric tweet id', () => {
    assert.deepEqual(
      classifyTweetResponse(201, JSON.stringify({ data: { id: '12345' } })),
      { ok: true, tweetId: '12345' }
    );
  });

  it('treats a 4xx as a rejection and a 5xx as ambiguous', () => {
    assert.deepEqual(classifyTweetResponse(403, '{"title":"Forbidden"}'), {
      ok: false,
      outcome: 'rejected',
      status: 403,
    });
    assert.deepEqual(classifyTweetResponse(500, ''), {
      ok: false,
      outcome: 'ambiguous',
      status: 500,
    });
    assert.equal(
      classifyTweetResponse(200, '{"data":{"id":"not-a-number"}}').ok,
      false
    );
  });
});

describe('publishTweet', () => {
  it('posts the text with OAuth and does not keep the error body', async () => {
    const seen: { url?: string; body?: string; authorization?: string } = {};
    const result = await publishTweet({
      text: 'hello',
      credentials,
      fetchImpl: async (url, init) => {
        seen.url = String(url);
        seen.body = String(init?.body);
        const headers = init?.headers as Record<string, string>;
        seen.authorization = headers.Authorization;
        return new Response('secret-body', { status: 403 });
      },
    });

    assert.equal(seen.url, 'https://api.twitter.com/2/tweets');
    assert.equal(seen.body, JSON.stringify({ text: 'hello' }));
    assert.equal(seen.authorization?.startsWith('OAuth '), true);
    assert.deepEqual(result, { ok: false, outcome: 'rejected', status: 403 });
    assert.equal(JSON.stringify(result).includes('secret-body'), false);
  });

  it('treats a network failure as ambiguous', async () => {
    const result = await publishTweet({
      text: 'hello',
      credentials,
      fetchImpl: async () => {
        throw new Error('socket hang up');
      },
    });
    assert.deepEqual(result, { ok: false, outcome: 'ambiguous' });
  });
});

describe('readXCredentials', () => {
  it('returns null unless all four secret names are set', () => {
    assert.equal(readXCredentials({}), null);
    assert.equal(
      readXCredentials({
        X_API_KEY: 'k',
        X_API_SECRET: 's',
        X_ACCESS_TOKEN: 't',
      }),
      null
    );
  });
});

describe('redactSecrets', () => {
  it('removes credential values from log text', () => {
    const line = redactSecrets('failed test-access-token-secret', [
      credentials.accessTokenSecret,
      credentials.accessToken,
    ]);
    assert.equal(line.includes('test-access'), false);
    assert.equal(line, 'failed [redacted]');
  });
});
