import crypto from 'crypto';
import { SITE_URL } from '../../constants/site';
import { EPISODE_GUID_PATTERN } from '../../constants/xPost';
import type { NotPostedReason } from './tweetPublishResult';

/** Official tweet_image cap is 5 MB. This cap is 5 MiB. */
export const SHARE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const SHARE_IMAGE_TIMEOUT_MS = 15_000;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export type ShareImageLoadResult =
  | { ok: true; bytes: Uint8Array; sha256: string; sourceUrl: string }
  | { ok: false; reason: NotPostedReason; status?: number };

/**
 * Builds the only share-image URL this flow may fetch.
 * Returns null unless the episode id is a UUID.
 */
export function canonicalShareImageUrl(guid: string): string | null {
  if (!EPISODE_GUID_PATTERN.test(guid)) return null;
  const url = `${SITE_URL}/og/episodes/${guid}.png`;
  return isCanonicalShareImageUrl(url, guid) ? url : null;
}

/**
 * True when the URL is the public episode PNG and nothing else.
 * Userinfo, another host, a port, a query, or a redirect target is rejected.
 */
export function isCanonicalShareImageUrl(value: string, guid: string): boolean {
  if (!EPISODE_GUID_PATTERN.test(guid)) return false;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return (
    parsed.protocol === 'https:' &&
    parsed.hostname === 'kaigaicareerlog.com' &&
    parsed.port === '' &&
    parsed.username === '' &&
    parsed.password === '' &&
    parsed.pathname === `/og/episodes/${guid}.png` &&
    parsed.search === '' &&
    parsed.hash === '' &&
    value === parsed.href
  );
}

/**
 * Downloads the episode PNG from the canonical URL.
 * Redirects are not followed. The issue body is not a fetch target.
 */
export async function fetchShareImage(options: {
  guid: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxBytes?: number;
}): Promise<ShareImageLoadResult> {
  const url = canonicalShareImageUrl(options.guid);
  if (!url) return { ok: false, reason: 'image_invalid' };
  const maxBytes = options.maxBytes ?? SHARE_IMAGE_MAX_BYTES;
  const fetchImpl = options.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(options.timeoutMs ?? SHARE_IMAGE_TIMEOUT_MS),
      headers: { Accept: 'image/png' },
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    if (name === 'AbortError' || name === 'TimeoutError') {
      return { ok: false, reason: 'image_fetch' };
    }
    return { ok: false, reason: 'image_fetch' };
  }

  if (
    response.status === 0 ||
    response.type === 'opaqueredirect' ||
    (response.status >= 300 && response.status < 400)
  ) {
    return { ok: false, reason: 'image_invalid', status: response.status };
  }
  if (response.status !== 200) {
    return { ok: false, reason: 'image_fetch', status: response.status };
  }

  const mime = (response.headers.get('content-type') ?? '')
    .split(';')[0]
    ?.trim()
    .toLowerCase();
  if (mime !== 'image/png') {
    return { ok: false, reason: 'image_invalid', status: response.status };
  }

  const declared = contentLength(response.headers.get('content-length'));
  if (
    declared === 'invalid' ||
    (typeof declared === 'number' && declared > maxBytes)
  ) {
    await response.body?.cancel().catch(() => undefined);
    return { ok: false, reason: 'image_invalid' };
  }

  const bytes = await readLimited(response, maxBytes);
  if (!bytes || !hasPngMagic(bytes)) {
    return { ok: false, reason: 'image_invalid' };
  }
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  return { ok: true, bytes, sha256, sourceUrl: url };
}

function contentLength(value: string | null): number | 'invalid' | null {
  if (value === null) return null;
  if (!/^[0-9]+$/.test(value)) return 'invalid';
  const declared = Number(value);
  if (!Number.isSafeInteger(declared) || declared <= 0) return 'invalid';
  return declared;
}

function hasPngMagic(bytes: Uint8Array): boolean {
  if (bytes.byteLength <= PNG_MAGIC.length) return false;
  return PNG_MAGIC.every((byte, index) => bytes[index] === byte);
}

async function readLimited(
  response: Response,
  maxBytes: number
): Promise<Uint8Array | null> {
  const reader = response.body?.getReader();
  if (!reader) {
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > maxBytes) return null;
    return buffer;
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value || value.byteLength === 0) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  if (total === 0) return null;
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}
