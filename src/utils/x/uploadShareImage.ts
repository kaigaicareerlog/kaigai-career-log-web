import { MEDIA_ID_PATTERN } from '../../constants/xPost';
import { oauthAuthorizationHeader, type XApiCredentials } from './publishTweet';
import { SHARE_IMAGE_MAX_BYTES } from './shareImage';
import type { NotPostedReason } from './tweetPublishResult';

/** Current simple-upload endpoint for images. Documented at docs.x.com. */
export const MEDIA_UPLOAD_URL = 'https://api.x.com/2/media/upload';

const MEDIA_CATEGORY = 'tweet_image';

export type MediaUploadResult =
  | { ok: true; mediaId: string }
  | { ok: false; reason: NotPostedReason; status?: number };

/**
 * Uploads one PNG with the same OAuth 1.0a user context as POST /2/tweets.
 * The signature covers the URL and method only. Secrets and the signature
 * are not written to the result.
 * A media id is not reusable across runs: the response may include
 * expires_after_secs, and this function does not return it for storage.
 */
export async function uploadShareImage(options: {
  bytes: Uint8Array;
  credentials: XApiCredentials;
  fetchImpl?: typeof fetch;
}): Promise<MediaUploadResult> {
  if (
    options.bytes.byteLength === 0 ||
    options.bytes.byteLength > SHARE_IMAGE_MAX_BYTES
  ) {
    return { ok: false, reason: 'image_invalid' };
  }

  const body = JSON.stringify({
    media: Buffer.from(options.bytes).toString('base64'),
    media_category: MEDIA_CATEGORY,
  });
  const authorization = oauthAuthorizationHeader(
    MEDIA_UPLOAD_URL,
    'POST',
    options.credentials
  );
  const fetchImpl = options.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(MEDIA_UPLOAD_URL, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        ...authorization,
      },
      body,
    });
  } catch {
    return { ok: false, reason: 'image_upload' };
  }

  if (response.status >= 300 && response.status < 400) {
    return { ok: false, reason: 'image_upload', status: response.status };
  }
  if (response.status === 401 || response.status === 403) {
    await response.body?.cancel().catch(() => undefined);
    return { ok: false, reason: 'image_auth', status: response.status };
  }
  if (response.status < 200 || response.status >= 300) {
    await response.body?.cancel().catch(() => undefined);
    return {
      ok: false,
      reason: 'image_upload',
      status: response.status || undefined,
    };
  }

  const rawBody = await response.text();
  return classifyUpload(rawBody, response.status);
}

function classifyUpload(rawBody: string, status: number): MediaUploadResult {
  try {
    const parsed = JSON.parse(rawBody) as {
      data?: { id?: unknown; processing_info?: { state?: unknown } };
    };
    const state = parsed.data?.processing_info?.state;
    if (typeof state === 'string' && state !== 'succeeded') {
      return { ok: false, reason: 'image_processing', status };
    }
    const id = parsed.data?.id;
    if (typeof id === 'string' && MEDIA_ID_PATTERN.test(id)) {
      return { ok: true, mediaId: id };
    }
  } catch {
    return { ok: false, reason: 'image_upload', status };
  }
  return { ok: false, reason: 'image_upload', status };
}
