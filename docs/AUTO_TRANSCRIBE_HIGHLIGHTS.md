# Automatic Transcription and Highlights Generation

## Overview

New episodes are transcribed automatically every day, each into its own pull
request for review. See [TRANSCRIPTION_GUIDE.md](TRANSCRIPTION_GUIDE.md) for
setup, the budget guard and the proper-noun glossary.

## How It Works

1. `update-rss.yml` (daily, 23:00 UTC) adds new episodes and tags them from
   the title and description
2. `transcribe-new-episodes.yml` (daily, 01:00 UTC) finds episodes with no
   transcript, newest first (1 per run by default), skipping any that already
   have an open transcript PR, and runs **Transcribe Episode** for each
3. **Transcribe Episode**:
   - checks the monthly budget, transcribes with ElevenLabs Scribe and records
     the spend on `main`
   - generates highlights and names the speakers
   - retags the episode with the transcript (reviewed tags are kept) and
     pushes the tags to `main`
   - opens a PR with the transcript; the description lists the speaker names
     and anything to check
4. Merge the PR to publish the transcript

To transcribe several older episodes at once, run **Transcribe New Episodes**
manually with a larger "How many episodes" value (raise
`MONTHLY_TRANSCRIPTION_BUDGET_USD` first if needed).

## Required Secrets

Make sure these secrets are configured in your GitHub repository:

- `ELEVENLABS_API_KEY` - For episode transcription (see [TRANSCRIPTION_GUIDE.md](TRANSCRIPTION_GUIDE.md))
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

- Transcribe the episode using ElevenLabs Scribe (within the monthly budget)
- Generate highlights (unless unchecked)
- Commit the changes

## Benefits

✅ **Manual transcription** - Transcribe episodes on-demand via GitHub Actions
✅ **AI-generated highlights** - Automatically creates episode highlights
✅ **Readable transcripts** - Punctuation and consistent proper nouns
✅ **Speaker diarization** - Identifies different speakers in episodes

## Troubleshooting

**Episodes not being transcribed?**

- Check that secrets are properly configured
- Verify the episode has an audio URL
- Check GitHub Actions logs for error messages

**Highlights not being generated?**

- Verify `GROQ_API_KEY` is set
- Check that transcript exists and is properly formatted
- Review the workflow logs for AI generation errors
