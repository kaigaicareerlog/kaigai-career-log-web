import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canonicalShareImageUrl,
  fetchShareImage,
  isCanonicalShareImageUrl,
} from './shareImage';

const guid = '11111111-1111-4111-8111-111111111111';
const canonical = `https://kaigaicareerlog.com/og/episodes/${guid}.png`;
const png = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01,
]);

describe('canonicalShareImageUrl', () => {
  it('accepts only the public episode PNG', () => {
    assert.equal(canonicalShareImageUrl(guid), canonical);
    assert.equal(canonicalShareImageUrl('not-a-guid'), null);
    assert.equal(canonicalShareImageUrl(`${guid}/../../etc/passwd`), null);
    assert.equal(isCanonicalShareImageUrl(canonical, guid), true);
    for (const url of [
      `http://kaigaicareerlog.com/og/episodes/${guid}.png`,
      `https://kaigaicareerlog.com.evil/og/episodes/${guid}.png`,
      `https://evil.test/og/episodes/${guid}.png`,
      `https://user:pass@kaigaicareerlog.com/og/episodes/${guid}.png`,
      `https://127.0.0.1/og/episodes/${guid}.png`,
      `https://kaigaicareerlog.com/og/episodes/${guid}.png?next=http://169.254.169.254`,
      `https://kaigaicareerlog.com/og/episodes/${guid}.jpg`,
    ]) {
      assert.equal(isCanonicalShareImageUrl(url, guid), false, url);
    }
  });
});

describe('fetchShareImage', () => {
  it('returns the PNG bytes from the canonical URL only', async () => {
    const calls: { url: string; redirect?: RequestRedirect }[] = [];
    const result = await fetchShareImage({
      guid,
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), redirect: init?.redirect });
        return new Response(png, {
          status: 200,
          headers: { 'content-type': 'image/png' },
        });
      },
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.sourceUrl, canonical);
    assert.equal(result.sha256.length, 64);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, canonical);
    assert.equal(calls[0]?.redirect, 'manual');
  });

  it('does not follow a redirect to an internal host', async () => {
    const calls: string[] = [];
    const result = await fetchShareImage({
      guid,
      fetchImpl: async (url) => {
        calls.push(String(url));
        return new Response(null, {
          status: 302,
          headers: { location: 'http://169.254.169.254/latest/meta-data' },
        });
      },
    });
    assert.deepEqual(result, {
      ok: false,
      reason: 'image_invalid',
      status: 302,
    });
    assert.deepEqual(calls, [canonical]);
  });

  it('rejects a non-image, a bad guid, and an oversized body', async () => {
    const html = await fetchShareImage({
      guid,
      fetchImpl: async () =>
        new Response('<html></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
    });
    assert.equal(html.ok, false);
    if (!html.ok) assert.equal(html.reason, 'image_invalid');

    let called = false;
    const badGuid = await fetchShareImage({
      guid: 'https://evil.test/a.png',
      fetchImpl: async () => {
        called = true;
        return new Response(png);
      },
    });
    assert.equal(called, false);
    assert.deepEqual(badGuid, { ok: false, reason: 'image_invalid' });

    const jpegMagic = await fetchShareImage({
      guid,
      fetchImpl: async () =>
        new Response(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        }),
    });
    assert.equal(jpegMagic.ok, false);

    const oversized = await fetchShareImage({
      guid,
      maxBytes: 8,
      fetchImpl: async () =>
        new Response(png, {
          status: 200,
          headers: { 'content-type': 'image/png', 'content-length': '999999' },
        }),
    });
    assert.deepEqual(oversized, { ok: false, reason: 'image_invalid' });

    const streamed = await fetchShareImage({
      guid,
      maxBytes: 8,
      fetchImpl: async () =>
        new Response(png, {
          status: 200,
          headers: { 'content-type': 'image/png' },
        }),
    });
    assert.deepEqual(streamed, { ok: false, reason: 'image_invalid' });
  });

  it('treats a timeout as a fetch failure and does not throw', async () => {
    const result = await fetchShareImage({
      guid,
      fetchImpl: async () => {
        const error = new Error('The operation was aborted');
        error.name = 'TimeoutError';
        throw error;
      },
    });
    assert.deepEqual(result, { ok: false, reason: 'image_fetch' });
    assert.equal(JSON.stringify(result).includes('aborted'), false);
  });
});
