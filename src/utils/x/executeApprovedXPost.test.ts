import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PodcastEpisode } from '../../types';
import { buildEpisodePostIssueBody } from './buildEpisodePostIssueBody';
import { buildNewEpisodePostTexts } from './buildNewEpisodePostTexts';
import {
  executeApprovedXPost,
  type LedgerStore,
  type XPostPublisher,
} from './executeApprovedXPost';
import type { IssueGateway } from './githubIssueGateway';
import type { ShareImageLoadResult } from './shareImage';
import type { TweetPublishResult } from './tweetPublishResult';
import type { MediaUploadResult } from './uploadShareImage';
import {
  emptyXPostLedger,
  withAwaitingApprovalEntry,
  type XPostLedger,
  type XPostLedgerEntry,
} from './xPostLedger';

const guid = '11111111-1111-4111-8111-111111111111';

function episode(title = 'タイトル'): PodcastEpisode {
  return {
    guid,
    title,
    description: '',
    duration: '00:30:00',
    date: '2026-11-08',
    link: '',
    audioUrl: '',
    spotifyUrl: 'https://open.spotify.com/episode/abc',
  };
}

function memoryStore(
  initial: XPostLedger,
  failOnNth?: number
): LedgerStore & { snapshot: () => XPostLedger } {
  let current = structuredClone(initial);
  let calls = 0;
  return {
    read: () => structuredClone(current),
    compareAndSwap(expected, next) {
      calls += 1;
      if (failOnNth === calls) return false;
      if (current.revision !== expected || next.revision !== expected + 1) {
        return false;
      }
      current = structuredClone(next);
      return true;
    },
    snapshot: () => structuredClone(current),
  };
}

function gateway(): IssueGateway & {
  comments: string[];
  bodies: string[];
  closed: number;
  removed: number;
} {
  return {
    comments: [],
    bodies: [],
    closed: 0,
    removed: 0,
    comment(_issueNumber, body) {
      this.comments.push(body);
    },
    close() {
      this.closed += 1;
    },
    removeLabel() {
      this.removed += 1;
    },
    replaceBody(_issueNumber, body) {
      this.bodies.push(body);
    },
  };
}

const imageHash = 'ab'.repeat(32);
const pngBytes = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01,
]);

function imageSource(
  failure?: Extract<ShareImageLoadResult, { ok: false }>,
  sourceUrl?: string
): {
  loads: string[];
  load: (guid: string) => Promise<ShareImageLoadResult>;
} {
  const loads: string[] = [];
  return {
    loads,
    async load(guid) {
      loads.push(guid);
      if (failure) return failure;
      return {
        ok: true,
        bytes: pngBytes,
        sha256: imageHash,
        sourceUrl:
          sourceUrl ?? `https://kaigaicareerlog.com/og/episodes/${guid}.png`,
      };
    },
  };
}

function publisher(options?: {
  main?: TweetPublishResult;
  reply?: TweetPublishResult;
  upload?: MediaUploadResult;
}): XPostPublisher & {
  mains: string[];
  mediaIds: string[];
  replies: { text: string; id: string }[];
  uploads: Uint8Array[];
} {
  const state = {
    mains: [] as string[],
    mediaIds: [] as string[],
    replies: [] as { text: string; id: string }[],
    uploads: [] as Uint8Array[],
  };
  return {
    ...state,
    async uploadImage(bytes) {
      state.uploads.push(bytes);
      return options?.upload ?? { ok: true, mediaId: '123456789012345' };
    },
    async postMain(text, mediaId) {
      state.mains.push(text);
      state.mediaIds.push(mediaId);
      return options?.main ?? { ok: true, tweetId: '111' };
    },
    async postReply(text, id) {
      state.replies.push({ text, id });
      return options?.reply ?? { ok: true, tweetId: '222' };
    },
  };
}

function awaiting(current: PodcastEpisode): {
  ledger: XPostLedger;
  body: string;
  texts: ReturnType<typeof buildNewEpisodePostTexts>;
} {
  const texts = buildNewEpisodePostTexts(current);
  const ledger = withAwaitingApprovalEntry(emptyXPostLedger(), {
    guid,
    issueNumber: 70,
    mainText: texts.mainText,
    replyText: texts.replyText,
    updatedAt: '2026-11-08T00:00:00.000Z',
  });
  const body = buildEpisodePostIssueBody({
    guid,
    episodePageUrl: texts.episodePageUrl,
    shareImageUrl: texts.shareImageUrl,
    mainTweetText: texts.mainText,
    urlsTweetText: texts.replyText,
  });
  return { ledger, body, texts };
}

async function run(options: {
  body: string;
  ledger: LedgerStore;
  episode?: PodcastEpisode | null;
  labelName?: string;
  senderLogin?: string;
  assigneeLogin?: string | null;
  allowlistRaw?: string;
  publisher?: ReturnType<typeof publisher>;
  issues?: IssueGateway;
  images?: ReturnType<typeof imageSource>;
}) {
  const issues = options.issues ?? gateway();
  const posts = options.publisher ?? publisher();
  const images = options.images ?? imageSource();
  const result = await executeApprovedXPost({
    issueNumber: 70,
    issueBody: options.body,
    labelName: options.labelName ?? 'x-post-approved',
    senderLogin: options.senderLogin ?? 'ryonryon',
    assigneeLogin:
      options.assigneeLogin === undefined ? 'ryonryon' : options.assigneeLogin,
    allowlistRaw:
      options.allowlistRaw === undefined ? 'ryonryon' : options.allowlistRaw,
    runId: 'run-1',
    now: () => '2026-11-08T01:00:00.000Z',
    loadEpisode: () =>
      options.episode === undefined ? episode() : options.episode,
    loadShareImage: images.load,
    ledger: options.ledger,
    publisher: posts,
    issues,
    log: () => undefined,
  });
  return { result, issues, posts, images };
}

describe('executeApprovedXPost', () => {
  it('does nothing for a label that is not approval', async () => {
    const setup = awaiting(episode());
    const store = memoryStore(setup.ledger);
    const issues = gateway();
    const { posts } = await run({
      body: setup.body,
      ledger: store,
      labelName: 'bug',
      issues,
    });
    assert.equal(posts.mains.length, 0);
    assert.equal(issues.comments.length, 0);
    assert.equal(issues.removed, 0);
  });

  it('does not publish when the allowlist is empty', async () => {
    const setup = awaiting(episode());
    const issues = gateway();
    const { posts } = await run({
      body: setup.body,
      ledger: memoryStore(setup.ledger),
      allowlistRaw: '  ',
      issues,
    });
    assert.equal(posts.mains.length, 0);
    assert.match(issues.comments[0] ?? '', /未設定/);
    assert.equal(issues.removed, 1);
  });

  it('does not publish for a login that is not allowlisted', async () => {
    const setup = awaiting(episode());
    const issues = gateway();
    const { posts } = await run({
      body: setup.body,
      ledger: memoryStore(setup.ledger),
      senderLogin: 'gotoworks510',
      issues,
    });
    assert.equal(posts.mains.length, 0);
    assert.equal(posts.replies.length, 0);
    assert.equal(issues.comments.length, 0);
    assert.equal(issues.removed, 1);
  });

  it('tells the assignee when their own login is not allowlisted', async () => {
    const setup = awaiting(episode());
    const issues = gateway();
    await run({
      body: setup.body,
      ledger: memoryStore(setup.ledger),
      allowlistRaw: 'someone-else',
      issues,
    });
    assert.match(issues.comments[0] ?? '', /承認者リスト/);
    assert.equal(issues.closed, 0);
  });

  it('does not publish an unrelated issue, even if the body looks like a command', async () => {
    const issues = gateway();
    const body = '$(rm -rf /)\n`reboot`';
    const { posts } = await run({
      body,
      ledger: memoryStore(emptyXPostLedger()),
      issues,
    });
    assert.equal(posts.mains.length, 0);
    assert.equal(issues.bodies.length, 0);
    assert.equal((issues.comments[0] ?? '').includes('$(rm'), false);
    assert.equal(issues.removed, 1);
  });

  it('does not publish an old issue that has no ledger row', async () => {
    const setup = awaiting(episode());
    const { posts } = await run({
      body: setup.body,
      ledger: memoryStore(emptyXPostLedger()),
    });
    assert.equal(posts.mains.length, 0);
  });

  it('refreshes drifted text and does not publish it', async () => {
    const original = awaiting(episode('古いタイトル'));
    const issues = gateway();
    const store = memoryStore(original.ledger);
    const { posts } = await run({
      body: original.body,
      ledger: store,
      episode: episode('新しいタイトル'),
      issues,
    });
    assert.equal(posts.mains.length, 0);
    assert.equal(posts.replies.length, 0);
    assert.equal(
      store.snapshot().entries[0]?.mainText.includes('新しいタイトル'),
      true
    );
    assert.equal(issues.bodies[0]?.includes('新しいタイトル'), true);
    assert.equal(issues.removed, 1);
    assert.equal(issues.closed, 0);
  });

  it('publishes the main post and the reply once, then ignores a rerun', async () => {
    const setup = awaiting(episode());
    const store = memoryStore(setup.ledger);
    const issues = gateway();
    const posts = publisher();
    const first = await run({
      body: setup.body,
      ledger: store,
      issues,
      publisher: posts,
    });
    assert.equal(first.result.outcome, 'published');
    assert.equal(first.images.loads.length, 1);
    assert.equal(posts.uploads.length, 1);
    assert.deepEqual(posts.mains, [setup.texts.mainText]);
    assert.deepEqual(posts.mediaIds, ['123456789012345']);
    assert.deepEqual(posts.replies, [
      { text: setup.texts.replyText, id: '111' },
    ]);
    assert.equal(store.snapshot().entries[0]?.status, 'published');
    assert.equal(store.snapshot().entries[0]?.mainTweetId, '111');
    assert.equal(store.snapshot().entries[0]?.replyTweetId, '222');
    assert.equal(store.snapshot().entries[0]?.shareImageSha256, imageHash);
    assert.equal(issues.closed, 1);
    assert.match(issues.comments.at(-1) ?? '', /メイン投稿にだけ/);
    assert.match(issues.comments.at(-1) ?? '', /返信には画像を付けていません/);
    assert.match(issues.comments.at(-1) ?? '', new RegExp(imageHash));
    assert.equal(
      (issues.comments.at(-1) ?? '').includes('画像は添付していません'),
      false
    );
    assert.match(issues.comments.at(-1) ?? '', /status\/111/);
    assert.match(issues.comments.at(-1) ?? '', /status\/222/);

    const before = posts.mains.length + posts.replies.length;
    const second = await run({
      body: setup.body,
      ledger: store,
      issues,
      publisher: posts,
    });
    assert.equal(second.result.outcome, 'already_published');
    assert.equal(posts.mains.length + posts.replies.length, before);
    assert.equal(issues.closed, 2);
  });

  it('does not publish when the ledger swap loses a race', async () => {
    const setup = awaiting(episode());
    const posts = publisher();
    const { result } = await run({
      body: setup.body,
      ledger: memoryStore(setup.ledger, 1),
      publisher: posts,
    });
    assert.equal(result.outcome, 'concurrent');
    assert.equal(posts.uploads.length, 1);
    assert.equal(posts.mains.length, 0);
    assert.equal(posts.replies.length, 0);
  });

  it('retries only the reply after the main post succeeded', async () => {
    const setup = awaiting(episode());
    const store = memoryStore(setup.ledger);
    const posts = publisher({
      reply: { ok: false, outcome: 'rejected', status: 403 },
    });
    const issues = gateway();
    await run({ body: setup.body, ledger: store, publisher: posts, issues });
    assert.equal(store.snapshot().entries[0]?.status, 'reply_pending');
    assert.equal(store.snapshot().entries[0]?.mainTweetId, '111');
    assert.equal(posts.uploads.length, 1);
    assert.equal(issues.closed, 0);
    assert.match(issues.comments.at(-1) ?? '', /返信だけ/);

    const retryPosts = publisher();
    const retry = await run({
      body: setup.body,
      ledger: store,
      publisher: retryPosts,
    });
    assert.equal(retry.result.outcome, 'published');
    assert.equal(retry.images.loads.length, 0);
    assert.equal(retryPosts.uploads.length, 0);
    assert.equal(retryPosts.mains.length, 0);
    assert.deepEqual(retryPosts.replies, [
      { text: setup.texts.replyText, id: '111' },
    ]);
  });

  it('does not send the main post again when its result is ambiguous', async () => {
    const setup = awaiting(episode());
    const store = memoryStore(setup.ledger);
    const posts = publisher({
      main: { ok: false, outcome: 'ambiguous', status: 500 },
    });
    await run({ body: setup.body, ledger: store, publisher: posts });
    assert.equal(posts.uploads.length, 1);
    assert.equal(posts.mains.length, 1);
    assert.equal(posts.replies.length, 0);
    assert.equal(store.snapshot().entries[0]?.status, 'needs_review');

    const again = publisher();
    const second = await run({
      body: setup.body,
      ledger: store,
      publisher: again,
    });
    assert.equal(second.result.outcome, 'needs_review');
    assert.equal(second.images.loads.length, 0);
    assert.equal(again.uploads.length, 0);
    assert.equal(again.mains.length, 0);
    assert.equal(again.replies.length, 0);
  });

  it('does not send the reply when the main id could not be saved', async () => {
    const setup = awaiting(episode());
    const store = memoryStore(setup.ledger, 2);
    const posts = publisher();
    const issues = gateway();
    const first = await run({
      body: setup.body,
      ledger: store,
      publisher: posts,
      issues,
    });
    assert.equal(first.result.postedReply, false);
    assert.equal(posts.replies.length, 0);
    assert.match(issues.comments.at(-1) ?? '', /status\/111/);
    assert.equal(store.snapshot().entries[0]?.status, 'needs_review');

    const again = publisher();
    await run({ body: setup.body, ledger: store, publisher: again });
    assert.equal(again.uploads.length, 0);
    assert.equal(again.mains.length, 0);
    assert.equal(again.replies.length, 0);
  });

  it('posts a shell-looking title only as tweet text data', async () => {
    const current = episode('$(id) && rm -rf /');
    const setup = awaiting(current);
    const posts = publisher();
    const issues = gateway();
    await run({
      body: setup.body,
      ledger: memoryStore(setup.ledger),
      episode: current,
      publisher: posts,
      issues,
    });
    assert.equal(posts.mains[0], setup.texts.mainText);
    assert.equal(posts.mains[0]?.includes('$(id)'), true);
    assert.equal(
      issues.comments.some((comment) => comment.includes('$(id)')),
      false
    );
  });

  it('moves an in-flight attempt to review instead of posting', async () => {
    const setup = awaiting(episode());
    const stuck: XPostLedgerEntry = {
      ...(setup.ledger.entries[0] as XPostLedgerEntry),
      status: 'main_in_flight',
      inFlightRunId: 'older-run',
    };
    const store = memoryStore({ ...setup.ledger, entries: [stuck] });
    const posts = publisher();
    await run({ body: setup.body, ledger: store, publisher: posts });
    assert.equal(posts.mains.length, 0);
    assert.equal(store.snapshot().entries[0]?.status, 'needs_review');
  });

  it('does not post when the share image cannot be fetched', async () => {
    const setup = awaiting(episode());
    const store = memoryStore(setup.ledger);
    const posts = publisher();
    const issues = gateway();
    const images = imageSource({
      ok: false,
      reason: 'image_fetch',
      status: 404,
    });
    const { result } = await run({
      body: setup.body,
      ledger: store,
      publisher: posts,
      issues,
      images,
    });
    assert.equal(result.outcome, 'not_posted');
    assert.equal(result.postedMain, false);
    assert.equal(posts.uploads.length, 0);
    assert.equal(posts.mains.length, 0);
    assert.equal(posts.replies.length, 0);
    assert.equal(store.snapshot().entries[0]?.status, 'awaiting_approval');
    assert.equal(store.snapshot().entries[0]?.mainTweetId, undefined);
    assert.equal(issues.closed, 0);
    assert.match(issues.comments.at(-1) ?? '', /画像なしでは公開しません/);
    assert.match(issues.comments.at(-1) ?? '', /HTTP 404/);
  });

  it('does not post when the image URL is not the canonical PNG', async () => {
    const setup = awaiting(episode());
    const store = memoryStore(setup.ledger);
    const posts = publisher();
    const images = imageSource(undefined, 'http://127.0.0.1/secret.png');
    const { result } = await run({
      body: setup.body,
      ledger: store,
      publisher: posts,
      images,
    });
    assert.equal(result.outcome, 'not_posted');
    assert.equal(posts.uploads.length, 0);
    assert.equal(posts.mains.length, 0);
    assert.equal(store.snapshot().entries[0]?.status, 'awaiting_approval');
  });

  it('does not post when media upload is unauthorized', async () => {
    const setup = awaiting(episode());
    const store = memoryStore(setup.ledger);
    const posts = publisher({
      upload: { ok: false, reason: 'image_auth', status: 403 },
    });
    const issues = gateway();
    const { result } = await run({
      body: setup.body,
      ledger: store,
      publisher: posts,
      issues,
    });
    assert.equal(result.outcome, 'not_posted');
    assert.equal(posts.uploads.length, 1);
    assert.equal(posts.mains.length, 0);
    assert.equal(posts.replies.length, 0);
    assert.equal(store.snapshot().entries[0]?.status, 'awaiting_approval');
    assert.equal(issues.closed, 0);
    assert.match(issues.comments.at(-1) ?? '', /認可/);
    assert.match(issues.comments.at(-1) ?? '', /HTTP 403/);
  });

  it('does not post or mark review when the upload response is lost', async () => {
    const setup = awaiting(episode());
    const store = memoryStore(setup.ledger);
    const posts = publisher({
      upload: { ok: false, reason: 'image_upload', status: 500 },
    });
    const { result } = await run({
      body: setup.body,
      ledger: store,
      publisher: posts,
    });
    assert.equal(result.outcome, 'not_posted');
    assert.equal(posts.mains.length, 0);
    assert.equal(store.snapshot().entries[0]?.status, 'awaiting_approval');
    assert.notEqual(store.snapshot().entries[0]?.status, 'needs_review');
  });

  it('does not post when the upload throws before the tweet request', async () => {
    const setup = awaiting(episode());
    const store = memoryStore(setup.ledger);
    const posts = publisher();
    posts.uploadImage = async (bytes) => {
      posts.uploads.push(bytes);
      throw new Error('ECONNRESET');
    };
    const { result } = await run({
      body: setup.body,
      ledger: store,
      publisher: posts,
    });
    assert.equal(result.outcome, 'not_posted');
    assert.equal(posts.mains.length, 0);
    assert.equal(store.snapshot().entries[0]?.status, 'awaiting_approval');
  });
});
