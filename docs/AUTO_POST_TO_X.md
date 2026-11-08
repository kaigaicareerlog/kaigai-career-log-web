# X announcement for a new episode

The daily RSS job does not post to X. It opens a GitHub issue and records that issue in `src/data/xPostLedger.json`.

`newEpisodeIntroPostedToX` means the issue was created. It does not mean the post is public. Publication is stored separately in the ledger (`mainTweetId`, `replyTweetId`, `status: published`).

## Approval

1. The RSS workflow runs `scripts/notify-episode-to-post-x.ts`.
2. An allowlisted GitHub user reviews the issue. The issue states the exact main post, the reply, how to check the X account, and that no image is uploaded.
3. That user adds the `x-post-approved` label.
4. `.github/workflows/approve-x-episode-post.yml` checks the sender against `X_POST_APPROVER_LOGINS`, checks the issue text against the current episode, and only then calls the X API.

If the variable is empty, nobody can publish. The label is removed and nothing is sent.

The workflow checks out the default branch. It does not run pull-request code.

## Required setup before the first approval

Create the label `x-post-approved`.

Set the repository variable `X_POST_APPROVER_LOGINS` to the GitHub login that may approve. The daily issue is assigned to `ryonryon`. Do not add other logins unless that person should be able to publish.

The existing secrets must be present and able to call `POST https://api.twitter.com/2/tweets` with OAuth 1.0a:

- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_TOKEN_SECRET`

This repository does not verify the token's user or the account's current API plan.

## Failure behavior

- Rejected by the API: nothing was published. Add the label again to retry the main post.
- Main succeeded and the reply was rejected: add the label again to send only the reply.
- The result is unclear, or the tweet id could not be saved: status becomes `needs_review`. The workflow will not send the main post again until the ledger is corrected by hand. The issue comment describes the edit.
- Both posts succeed: the issue is closed and the comment contains both status URLs.

`scripts/auto-post-episode-to-x.ts` and the manual `Post Episode to X` workflow are not part of this approval gate. Do not attach the auto-post script to the RSS job.
