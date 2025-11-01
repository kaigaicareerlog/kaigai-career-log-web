# Auto Post Episode to X

This document explains the automated workflow for posting new podcast episodes to X (Twitter).

## Overview

The system automatically posts episodes to X after the RSS feed is updated. It uses the `newEpisodeIntroPostedToX` flag in the episodes.json file to track which episodes have been posted.

## How It Works

### 1. Episode Generation (`generate-episodes.ts`)

When episodes are generated from the RSS feed:
- **Existing episodes**: Preserve the `newEpisodeIntroPostedToX` value from the previous file
- **New episodes**: Set `newEpisodeIntroPostedToX` to `false` by default (not posted yet)

### 2. Manual Flag Update

To prevent an episode from being automatically posted to X, manually set `newEpisodeIntroPostedToX` to `true` in the episodes.json file:

```json
{
  "title": "Episode Title",
  "guid": "episode-guid",
  "newEpisodeIntroPostedToX": true,
  ...
}
```

### 3. Automatic Posting

During the `Update RSS Feed` workflow:

1. After updating all platform URLs, the workflow looks for episodes with `newEpisodeIntroPostedToX: false`
2. If found, it posts the first episode to X using the configured host handles
3. After successful posting, it updates `newEpisodeIntroPostedToX` to `true`
4. All changes (including the updated flag) are committed and pushed at the end of the workflow

### 4. Manual Posting

You can also manually post an episode using the `Post Episode to X (Twitter)` workflow:
- Go to Actions → Post Episode to X (Twitter)
- Enter the episode GUID
- Select which hosts to include
- The workflow will post to X and update the flag

## Workflows

### `update-rss.yml` (Update RSS Feed)
- Runs daily at 4pm Vancouver time
- Downloads latest RSS feed
- Generates episodes with preserved `newEpisodeIntroPostedToX` flags
- Updates all platform URLs for new episodes
- **Automatically posts episodes with `newEpisodeIntroPostedToX: false` to X**
- Updates the flag to `true` after posting
- Commits and pushes all changes

### `post-x-new-episode-intro.yml` (Post Episode to X - Manual)
- Manually triggered via GitHub Actions UI
- Posts a specific episode by GUID
- Updates `newEpisodeIntroPostedToX` to `true` after posting
- Commits and pushes changes

## Scripts

### `auto-post-episode-to-x.ts`

Finds the first episode with `newEpisodeIntroPostedToX: false` (not posted yet) and posts it to X.

```bash
tsx scripts/auto-post-episode-to-x.ts "@togashi_ryo, @onepercentdsgn"
```

### `post-x-new-episode-intro.ts`

Posts a specific episode to X by GUID.

```bash
tsx scripts/post-x-new-episode-intro.ts "<guid>" "@togashi_ryo, @onepercentdsgn"
```

## Workflow

```
1. Update RSS Feed (Daily at 4pm Vancouver time)
   ↓
2. Generate Episodes (preserves newEpisodeIntroPostedToX flags)
   ↓
3. Update All Platform URLs
   ↓
4. Auto Post Episode to X
   ├─ Find episode with newEpisodeIntroPostedToX: false (not posted yet)
   ├─ Post to X
   └─ Update newEpisodeIntroPostedToX to true (mark as posted)
   ↓
5. Commit & Push All Changes
```

## Environment Variables

Required secrets for posting to X:
- `X_API_KEY` - Your X API Key (Consumer Key)
- `X_API_SECRET` - Your X API Secret (Consumer Secret)
- `X_ACCESS_TOKEN` - Your X Access Token
- `X_ACCESS_TOKEN_SECRET` - Your X Access Token Secret

## Important Notes

1. **Only one episode at a time**: The auto-post workflow posts only the first episode with `newEpisodeIntroPostedToX: false`
2. **Automatic flag update**: After posting, the flag is automatically set to `true` to mark it as posted and prevent duplicate posts
3. **Manual override**: You can manually set `newEpisodeIntroPostedToX: true` at any time to prevent an episode from being automatically posted
4. **Idempotent**: If no episodes have `newEpisodeIntroPostedToX: false`, the workflow exits successfully without posting
5. **Default behavior**: New episodes are set to `false` by default, so they will be automatically posted

## Example: Preventing an Episode from Auto-Posting

By default, new episodes will be automatically posted. To prevent this:

1. After RSS feed update, edit `public/rss/YYYYMMDD-HHMM-episodes.json`
2. Find the episode you want to skip
3. Set `newEpisodeIntroPostedToX: true` (mark as already posted)
4. Commit and push the change
5. The episode will not be automatically posted

## Example: Allowing an Episode to Auto-Post (Default Behavior)

1. New episodes are automatically generated with `newEpisodeIntroPostedToX: false`
2. During the next RSS feed update (daily at 4pm Vancouver time)
3. The episode will be automatically posted to X
4. The flag will be automatically set to `true` and committed

