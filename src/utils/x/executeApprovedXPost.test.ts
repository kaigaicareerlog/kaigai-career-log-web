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
import type { TweetPublishResult } from './tweetPublishResult';
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

function publisher(options?: {
  main?: TweetPublishResult;
  reply?: TweetPublishResult;
}): XPostPublisher & {
  mains: string[];
  replies: { text: string; id: string }[];
} {
  const state = {
    mains: [] as string[],
    replies: [] as { text: string; id: string }[],
  };
  return {
    ...state,
    async postMain(text) {
      state.mains.push(text);
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
}) {
  const issues = options.issues ?? gateway();
  const posts = options.publisher ?? publisher();
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
    ledger: options.ledger,
    publisher: posts,
    issues,
    log: () => undefined,
  });
  return { result, issues, posts };
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
    assert.deepEqual(posts.mains, [setup.texts.mainText]);
    assert.deepEqual(posts.replies, [
      { text: setup.texts.replyText, id: '111' },
    ]);
    assert.equal(store.snapshot().entries[0]?.status, 'published');
    assert.equal(store.snapshot().entries[0]?.mainTweetId, '111');
    assert.equal(store.snapshot().entries[0]?.replyTweetId, '222');
    assert.equal(issues.closed, 1);
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
    assert.equal(issues.closed, 0);
    assert.match(issues.comments.at(-1) ?? '', /返信だけ/);

    const retryPosts = publisher();
    const retry = await run({
      body: setup.body,
      ledger: store,
      publisher: retryPosts,
    });
    assert.equal(retry.result.outcome, 'published');
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
    assert.equal(posts.replies.length, 0);
    assert.equal(store.snapshot().entries[0]?.status, 'needs_review');

    const again = publisher();
    const second = await run({
      body: setup.body,
      ledger: store,
      publisher: again,
    });
    assert.equal(second.result.outcome, 'needs_review');
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
});
