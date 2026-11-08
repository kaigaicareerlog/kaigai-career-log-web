import { EPISODE_GUID_PATTERN } from '../../constants/xPost';
import { SITE_URL } from '../../constants/site';

export type EpisodePostParse =
  | { ok: true; guid: string; mainText: string; replyText: string }
  | { ok: false; guid: string | null };

const GUID_MARKER =
  /<!-- x-post-guid:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}) -->/gi;

/**
 * Reads the guid and the two tweet texts from an issue body.
 * The fenced copies must equal the machine-readable copies.
 * Text is returned as data. It is never evaluated.
 */
export function parseEpisodePostIssue(body: string): EpisodePostParse {
  const markers = [...body.matchAll(GUID_MARKER)];
  if (markers.length !== 1) return { ok: false, guid: null };
  const guid = markers[0][1];
  if (!guid || !EPISODE_GUID_PATTERN.test(guid))
    return { ok: false, guid: null };

  const mainText = extractBlock(
    body,
    '<!-- x-post-main:start -->',
    '<!-- x-post-main:end -->'
  );
  const replyText = extractBlock(
    body,
    '<!-- x-post-reply:start -->',
    '<!-- x-post-reply:end -->'
  );
  if (mainText === null || replyText === null) return { ok: false, guid };

  const fences = extractFences(body);
  if (
    fences.length !== 2 ||
    fences[0] !== mainText ||
    fences[1] !== replyText
  ) {
    return { ok: false, guid };
  }
  if (!body.includes(`${SITE_URL}/episodes/${guid}/`)) {
    return { ok: false, guid };
  }
  return { ok: true, guid, mainText, replyText };
}

function extractBlock(body: string, start: string, end: string): string | null {
  if (countOf(body, start) !== 1 || countOf(body, end) !== 1) return null;
  const startIndex = body.indexOf(start);
  const endIndex = body.indexOf(end);
  if (endIndex < startIndex) return null;
  let text = body.slice(startIndex + start.length, endIndex);
  if (text.startsWith('\n')) text = text.slice(1);
  if (text.endsWith('\n')) text = text.slice(0, -1);
  return text;
}

function extractFences(body: string): string[] {
  const blocks: string[] = [];
  for (const match of body.matchAll(/```\n([\s\S]*?)```/g)) {
    blocks.push((match[1] ?? '').replace(/\n$/, ''));
  }
  return blocks;
}

function countOf(body: string, token: string): number {
  return body.split(token).length - 1;
}
