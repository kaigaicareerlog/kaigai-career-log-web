import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { XApiCredentials } from './publishTweet';
import { SHARE_IMAGE_MAX_BYTES } from './shareImage';
import { uploadShareImage } from './uploadShareImage';

const credentials: XApiCredentials = {
  apiKey: 'test-api-key',
  apiSecret: 'test-api-secret-value',
  accessToken: 'test-access-token',
  accessTokenSecret: 'test-access-token-secret-value',
};

const png = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01,
]);

function response(status: number, body: string): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('uploadShareImage', () => {
  it('posts the PNG to the documented media endpoint', async () => {
    const seen: {
      url?: string;
      body?: string;
      authorization?: string;
      redirect?: RequestRedirect;
    } = {};
    const result = await uploadShareImage({
      bytes: png,
      credentials,
      fetchImpl: async (url, init) => {
        seen.url = String(url);
        seen.body = String(init?.body);
        seen.redirect = init?.redirect;
        const headers = init?.headers as Record<string, string>;
        seen.authorization = headers.Authorization;
        return response(
          200,
          JSON.stringify({
            data: { id: '123456789012345', expires_after_secs: 120 },
          })
        );
      },
    });

    assert.equal(seen.url, 'https://api.x.com/2/media/upload');
    assert.equal(seen.redirect, 'manual');
    const payload = JSON.parse(seen.body ?? '{}') as {
      media?: string;
      media_category?: string;
    };
    assert.equal(payload.media_category, 'tweet_image');
    assert.equal(payload.media, Buffer.from(png).toString('base64'));
    assert.equal(seen.authorization?.startsWith('OAuth '), true);
    assert.equal(seen.authorization?.includes(credentials.apiSecret), false);
    assert.equal(
      seen.authorization?.includes(credentials.accessTokenSecret),
      false
    );
    assert.equal(
      seen.authorization?.includes(payload.media ?? 'missing'),
      false
    );
    assert.deepEqual(result, { ok: true, mediaId: '123456789012345' });
    assert.equal(JSON.stringify(result).includes('expires_after_secs'), false);
  });

  it('does not treat an auth failure or a pending upload as a media id', async () => {
    const denied = await uploadShareImage({
      bytes: png,
      credentials,
      fetchImpl: async () =>
        response(401, JSON.stringify({ detail: credentials.apiSecret })),
    });
    assert.deepEqual(denied, {
      ok: false,
      reason: 'image_auth',
      status: 401,
    });
    assert.equal(JSON.stringify(denied).includes(credentials.apiSecret), false);

    const forbidden = await uploadShareImage({
      bytes: png,
      credentials,
      fetchImpl: async () => response(403, 'nope'),
    });
    assert.equal(forbidden.ok, false);
    if (!forbidden.ok) assert.equal(forbidden.reason, 'image_auth');

    const pending = await uploadShareImage({
      bytes: png,
      credentials,
      fetchImpl: async () =>
        response(
          200,
          JSON.stringify({
            data: {
              id: '123',
              processing_info: { state: 'pending' },
            },
          })
        ),
    });
    assert.deepEqual(pending, {
      ok: false,
      reason: 'image_processing',
      status: 200,
    });

    const lost = await uploadShareImage({
      bytes: png,
      credentials,
      fetchImpl: async () => {
        throw new Error(`socket ${credentials.accessTokenSecret}`);
      },
    });
    assert.deepEqual(lost, { ok: false, reason: 'image_upload' });
    assert.equal(
      JSON.stringify(lost).includes(credentials.accessTokenSecret),
      false
    );
  });

  it('does not upload an empty or oversized buffer', async () => {
    let called = false;
    const empty = await uploadShareImage({
      bytes: new Uint8Array(),
      credentials,
      fetchImpl: async () => {
        called = true;
        return response(200, '{}');
      },
    });
    assert.equal(called, false);
    assert.deepEqual(empty, { ok: false, reason: 'image_invalid' });

    const tooBig = await uploadShareImage({
      bytes: new Uint8Array(SHARE_IMAGE_MAX_BYTES + 1),
      credentials,
      fetchImpl: async () => {
        called = true;
        return response(200, '{}');
      },
    });
    assert.equal(called, false);
    assert.deepEqual(tooBig, { ok: false, reason: 'image_invalid' });
  });
});
