# Automatic Transcription and Highlights Generation

## Overview

The RSS update workflow now automatically transcribes new episodes and generates highlights when it runs.

## How It Works

When the `update-rss.yml` workflow runs (daily or manually):

1. **Downloads RSS feed** - Fetches the latest podcast RSS feed
2. **Converts to JSON** - Parses episode data into structured format
3. **Updates URLs** - Finds Spotify and YouTube URLs for new episodes
4. **🆕 Finds untranscribed episodes** - Checks which episodes don't have transcripts yet
5. **🆕 Transcribes episodes** - Automatically transcribes any new episodes
6. **🆕 Generates highlights** - Creates AI-generated highlights for each transcribed episode
7. **Commits changes** - Saves all updates to the repository

## Required Secrets

Make sure these secrets are configured in your GitHub repository:

- `ASSEMBLYAI_API_KEY` - For episode transcription
- `GROQ_API_KEY` - For AI-generated highlights
- `SPOTIFY_CLIENT_ID` - For Spotify URL finding
- `SPOTIFY_CLIENT_SECRET` - For Spotify URL finding
- `YOUTUBE_API_KEY` - For YouTube URL finding

## Manual Transcription

If you need to manually transcribe an episode:

1. Go to **Actions** → **Transcribe Episode**
2. Click **Run workflow**
3. Enter the episode GUID
4. **Generate highlights** is now checked by default
5. Click **Run workflow**

The workflow will:

- Transcribe the episode using AssemblyAI
- Clean up the transcript
- Generate highlights (unless unchecked)
- Commit the changes

## Script Reference

### `find-episodes-without-transcripts.ts`

Finds episodes that don't have transcripts yet.

**Usage:**

```bash
npm run find-episodes-without-transcripts [episodes-file]
```

**Output:** JSON array of episodes needing transcription

**Example:**

```bash
npm run find-episodes-without-transcripts
# Output: [{"guid": "abc123", "title": "Episode Title"}]
```

## Benefits

✅ **Fully automated** - No manual intervention needed for new episodes
✅ **Consistent workflow** - Every episode gets transcribed and highlighted
✅ **Time-saving** - Runs automatically during daily RSS updates
✅ **Fail-safe** - Continues even if individual episodes fail

## Troubleshooting

**Episodes not being transcribed?**

- Check that secrets are properly configured
- Verify the episode has an audio URL
- Check GitHub Actions logs for error messages

**Highlights not being generated?**

- Verify `GROQ_API_KEY` is set
- Check that transcript exists and is properly formatted
- Review the workflow logs for AI generation errors
