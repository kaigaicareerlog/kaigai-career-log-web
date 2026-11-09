# X announcement for a new episode

The daily RSS job does not post to X. It opens a GitHub issue and records that issue in `src/data/xPostLedger.json`.

`newEpisodeIntroPostedToX` means the issue was created. It does not mean the post is public. Publication is stored separately in the ledger (`mainTweetId`, `replyTweetId`, `status: published`).

## Approval

1. The RSS workflow runs `scripts/notify-episode-to-post-x.ts`.
2. An allowlisted GitHub user reviews the issue. The issue shows the exact main post, the reply, the account to check, and the episode share image.
3. That user adds the `x-post-approved` label.
4. `.github/workflows/approve-x-episode-post.yml` checks the sender against `X_POST_APPROVER_LOGINS`, checks the issue text against the current episode, uploads the share image, and only then calls the X API. The image is attached to the main post. The reply stays text-only.

If the variable is empty, nobody can publish. The label is removed and nothing is sent.

The workflow checks out the default branch. It does not run pull-request code.

## Required setup before the first approval

Create the label `x-post-approved`.

Set the repository variable `X_POST_APPROVER_LOGINS` to the GitHub login that may approve. The daily issue is assigned to `ryonryon`. Do not add other logins unless that person should be able to publish.

The existing secrets must be present. They sign both calls with OAuth 1.0a user context (URL and method only; the JSON body is not part of the signature):

- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_TOKEN_SECRET`

Calls:

- `POST https://api.x.com/2/media/upload` with JSON `{ "media": "<base64>", "media_category": "tweet_image" }`
- `POST https://api.twitter.com/2/tweets` with `media.media_ids` on the main post only

Checked against docs.x.com on 2026-11-09 (`/x-api/media/introduction`, `/x-api/media/upload-media`, `/x-api/posts/create-post`). Those pages list two user-context options: an OAuth 2.0 user token whose upload scope is `media.write`, and a user token whose OpenAPI scheme is `http` / `OAuth` with empty scopes. The rendered page labels that second scheme "Bearer", which does not match the scheme name. This repository keeps using the four OAuth 1.0a secrets above. It does not create a new token. Whether the current token is allowed to upload media has not been tried, and this code does not assume a plan, a credit balance, or that permission.

Simple upload is the documented path for an image under the 5 MB `tweet_image` cap. Chunked upload is for video. This PNG is generated at build time at 1200×630.

## Share image

The only fetch target is `https://kaigaicareerlog.com/og/episodes/<guid>.png`, built from the episode id. A URL written in the issue is never fetched. Redirects are not followed. The response must be HTTP 200, `Content-Type: image/png`, PNG bytes, and at most 5 MiB (5,242,880 bytes).

The URL stays the same for an episode. A later site rebuild can change the bytes (title, guests, places, or the image template). The workflow uploads whatever PNG that URL returns when the label is processed. It does not freeze the bytes from the moment the issue was opened, because a new episode's image is often not deployed yet when the issue is created. The ledger stores the SHA-256 of the bytes that were uploaded. That hash is not a promise that the URL will keep returning the same file.

The media id is used only for the main tweet in the same run. It is not saved. The upload response can include `expires_after_secs`, so a later attempt uploads a new file instead of reusing an id. If `processing_info.state` is present and is not `succeeded`, nothing is posted. This flow does not call a media-status endpoint.

## Failure behavior

- The image cannot be fetched, is not a PNG, is too large, or the upload is rejected or incomplete: the tweet endpoint is not called. The status returns to `awaiting_approval`. Add the label again to fetch and upload from the start. An approved image post is never published as text only.
- An upload that returns no usable media id, including HTTP 5xx before the tweet call, also posts nothing. The attempt is not marked in flight, so the label can be added again. An unused media object may exist if X accepted the upload and the response was lost. The main post was not created.
- If another run wins the ledger race after this run has uploaded, this run does not post. The winning run uploads its own image.
- The main tweet is rejected after a successful upload: nothing is published. Add the label again to upload a fresh image and retry the main post. The previous media id is not reused.
- Main succeeded and the reply was rejected: add the label again to send only the reply. The reply does not upload or attach an image, and the main post is not sent again.
- The tweet result is unclear, or the tweet id could not be saved: status becomes `needs_review`. The workflow will not send the main post again, and it will not upload another image, until the ledger is corrected by hand. The issue comment describes the edit.
- Both posts succeed: the issue is closed. The comment contains both status URLs and the SHA-256 of the attached PNG.

Secrets, OAuth signatures, and response bodies are not written to logs or issue comments.

`scripts/auto-post-episode-to-x.ts` and the manual `Post Episode to X` workflow are not part of this approval gate. Do not attach the auto-post script to the RSS job.

## Recreate an approval issue

The daily job only opens an issue when `newEpisodeIntroPostedToX` is false. An episode that already has that flag, and no ledger row, needs a manual issue.

Run **Create X approval issue** from the Actions tab on `main`. The only input is the episode GUID. The workflow checks that the value is a UUID, opens one new-format issue assigned to `ryonryon`, and commits one `awaiting_approval` ledger row. It does not post to X, upload media, or add `x-post-approved`.

If the ledger already has any row for that GUID, the workflow stops and does not open another issue. Older issues that are not in the ledger are left as they are.
