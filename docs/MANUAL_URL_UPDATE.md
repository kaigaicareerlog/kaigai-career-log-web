# Manual URL Update Guide

This guide explains how to manually update podcast episode URLs using the GitHub Actions workflow.

## Overview

The **Update Episode URLs Manually** workflow allows you to update URLs for a specific episode without running the full automated process. This is useful when:

- 🔧 The automatic URL finder couldn't match an episode
- ✏️ You need to fix an incorrect URL
- 🆕 You want to add URLs for a new platform
- ⚡ You need to update a URL immediately without waiting for the scheduled run

## Quick Start

### Step 1: Find the Episode GUID

1. Go to your repository and open the latest episodes file:
   - Path: `public/rss/YYYYMMDD-HHMM-episodes.json`
   - Or view on GitHub: `https://github.com/YOUR_USERNAME/kaigai-career-log-web/blob/main/public/rss/`
   - Look for the most recent file (highest timestamp)

2. Find your episode in the JSON file:

   ```json
   {
     "title": "Episode Title",
     "guid": "cc15a703-73c7-406b-8abc-ad7d0a192d05",
     "spotifyUrl": "",
     "youtubeUrl": ""
   }
   ```

3. Copy the `guid` value (e.g., `cc15a703-73c7-406b-8abc-ad7d0a192d05`)

### Step 2: Get the URLs

Find the episode on each platform:

**Spotify:**

1. Search for your episode on Spotify
2. Click "Share" → "Copy Episode Link"
3. Example: `https://open.spotify.com/episode/1pCYF2Hh9auRtTCELuPK8e`

**YouTube:**

1. Find your episode on YouTube
2. Copy the video URL
3. Example: `https://youtu.be/z0jJm4cqHbA`

**Apple Podcasts (optional):**

1. Find your episode on Apple Podcasts
2. Copy the episode URL
3. Example: `https://podcasts.apple.com/ca/podcast/...`

**Amazon Music (optional):**

1. Find your episode on Amazon Music
2. Copy the episode URL
3. Example: `https://music.amazon.ca/podcasts/...`

### Step 3: Run the Workflow

1. Go to your repository on GitHub
2. Click the **"Actions"** tab
3. In the left sidebar, click **"Update Episode URLs Manually"**
4. Click the **"Run workflow"** dropdown button (right side)
5. Fill in the form:
   - **guid**: Paste the GUID from Step 1 (required)
   - **spotify_url**: Paste Spotify URL (optional)
   - **youtube_url**: Paste YouTube URL (optional)
   - **apple_podcast_url**: Paste Apple Podcasts URL (optional)
   - **amazon_music_url**: Paste Amazon Music URL (optional)
6. Click **"Run workflow"** button

### Step 4: Verify the Update

1. Wait for the workflow to complete (~30 seconds)
2. Check the workflow logs for success messages
3. View the updated `episodes.json` file to confirm changes

## Detailed Instructions

### Form Fields

| Field                 | Required | Description                           | Example                                                         |
| --------------------- | -------- | ------------------------------------- | --------------------------------------------------------------- |
| **guid**              | ✅ Yes   | The unique identifier for the episode | `cc15a703-73c7-406b-8abc-ad7d0a192d05`                          |
| **spotify_url**       | ❌ No    | Full Spotify episode URL              | `https://open.spotify.com/episode/xxx`                          |
| **youtube_url**       | ❌ No    | Full YouTube video URL                | `https://youtu.be/xxx` or `https://www.youtube.com/watch?v=xxx` |
| **apple_podcast_url** | ❌ No    | Full Apple Podcasts episode URL       | `https://podcasts.apple.com/...`                                |
| **amazon_music_url**  | ❌ No    | Full Amazon Music episode URL         | `https://music.amazon.ca/...`                                   |

**Note**: At least one URL must be provided. You can update one, some, or all URLs at once.

### What the Workflow Does

1. **Finds the latest episodes file** - Automatically locates the most recent `episodes.json`
2. **Locates the episode** - Searches for the episode by GUID
3. **Updates the URLs** - Replaces old URLs with new ones (or adds them if empty)
4. **Commits changes** - Saves changes back to the repository
5. **Shows summary** - Displays what was updated in the logs

### Example Scenarios

#### Scenario 1: Add Missing Spotify URL

**Situation**: Automatic finder couldn't find the Spotify URL

**Steps**:

1. Find GUID: `cc15a703-73c7-406b-8abc-ad7d0a192d05`
2. Find Spotify URL manually
3. Run workflow with:
   - guid: `cc15a703-73c7-406b-8abc-ad7d0a192d05`
   - spotify_url: `https://open.spotify.com/episode/1pCYF2Hh9auRtTCELuPK8e`
   - (leave other fields empty)

#### Scenario 2: Fix Incorrect YouTube URL

**Situation**: Wrong YouTube URL was added automatically

**Steps**:

1. Find GUID from episodes.json
2. Get correct YouTube URL
3. Run workflow with:
   - guid: `[episode-guid]`
   - youtube_url: `https://youtu.be/[correct-id]`

#### Scenario 3: Add Multiple URLs at Once

**Situation**: New episode published, need to add all URLs

**Steps**:

1. Get episode GUID
2. Find URLs on all platforms
3. Run workflow with:
   - guid: `[episode-guid]`
   - spotify_url: `[spotify-url]`
   - youtube_url: `[youtube-url]`
   - apple_podcast_url: `[apple-url]`
   - amazon_music_url: `[amazon-url]`

## Workflow Output

### Successful Update

```
🔄 Updating episode URLs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 GUID: cc15a703-73c7-406b-8abc-ad7d0a192d05

🎵 Spotify: https://open.spotify.com/episode/xxx
🎥 YouTube: https://youtu.be/xxx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Loading episodes from: public/rss/20251015-1451-episodes.json

📝 Found episode: "【特別回】なぜ海外就職では日本の常識が通用しない？..."

🔄 Updating URLs:
   🎵 Spotify: (empty) → https://open.spotify.com/episode/xxx
   🎥 YouTube: (empty) → https://youtu.be/xxx

✅ Successfully updated 2 URL(s) in public/rss/20251015-1451-episodes.json

📊 Episode Summary:
   GUID: cc15a703-73c7-406b-8abc-ad7d0a192d05
   Title: 【特別回】なぜ海外就職では日本の常識が通用しない？...
   Spotify: https://open.spotify.com/episode/xxx
   YouTube: https://youtu.be/xxx
   Apple Podcast: (not set)
   Amazon Music: (not set)

✅ Changes committed and pushed successfully
```

## Troubleshooting

### Error: "Episode with GUID not found"

**Problem**: The provided GUID doesn't exist in episodes.json

**Solution**:

1. Double-check the GUID in episodes.json
2. Make sure you copied the complete GUID (with hyphens)
3. Verify you're looking at the latest episodes file

### Error: "No URLs provided"

**Problem**: All URL fields were left empty

**Solution**:

1. Provide at least one URL
2. Fill in spotify_url, youtube_url, apple_podcast_url, or amazon_music_url

### Workflow Doesn't Start

**Problem**: Nothing happens after clicking "Run workflow"

**Solution**:

1. Check that you have the proper permissions (write access to repository)
2. Refresh the page and try again
3. Make sure you clicked the final "Run workflow" button (green)

### No Changes Committed

**Situation**: Workflow completes but shows "No changes to commit"

**Possible Reasons**:

1. The URLs you provided are identical to what's already in the file
2. The update didn't actually change anything

**Not necessarily an error** - just means the URLs were already correct

## Local Testing

You can also test the script locally before running the workflow:

```bash
# Single URL update
npm run update-episode-by-guid \
  public/rss/20251015-1451-episodes.json \
  cc15a703-73c7-406b-8abc-ad7d0a192d05 \
  --spotify "https://open.spotify.com/episode/xxx"

# Multiple URLs
npm run update-episode-by-guid \
  public/rss/20251015-1451-episodes.json \
  cc15a703-73c7-406b-8abc-ad7d0a192d05 \
  --spotify "https://open.spotify.com/episode/xxx" \
  --youtube "https://youtu.be/xxx"
```

## Tips & Best Practices

### ✅ Do's

- ✅ Copy complete URLs (including https://)
- ✅ Verify the episode GUID before running
- ✅ Check the workflow logs to confirm success
- ✅ Update multiple URLs at once when possible
- ✅ Use this for urgent fixes or corrections

### ❌ Don'ts

- ❌ Don't use partial URLs (must start with `https://`)
- ❌ Don't add spaces or line breaks in URLs
- ❌ Don't run multiple times for the same episode unnecessarily
- ❌ Don't use this for bulk updates (use the automated workflow instead)

## Related Documentation

- [Automatic URL Finder](./AUTO_URL_FINDER.md) - How automatic URL discovery works
- [GitHub Secrets Setup](./GITHUB_SECRETS_SETUP.md) - Setting up API credentials
- [Episode URLs Update](./EPISODE_URLS_UPDATE.md) - Batch update guide

## Need Help?

If you run into issues:

1. **Check workflow logs**: Actions tab → Click on the failed run → Read error messages
2. **Verify GUID**: Make sure it exists in the latest episodes.json file
3. **Test locally**: Run the script on your machine to debug
4. **Check file path**: Ensure the episodes file exists in public/rss/

## Technical Details

### Workflow File

- Location: `.github/workflows/update-urls-manually.yml`
- Trigger: Manual (workflow_dispatch)
- Permissions: write (for committing changes)

### Script

- Location: `scripts/update-episode-by-guid.ts`
- Language: TypeScript
- Runtime: Node.js with tsx

### Automatic File Detection

- Searches `public/rss/` directory
- Finds files matching: `YYYYMMDD-HHMM-episodes.json`
- Selects the most recent (highest timestamp)
- Works even after RSS feed updates

## Summary

The manual URL update workflow provides:

✅ **Quick updates** - Update URLs in ~30 seconds  
✅ **Flexible** - Update one or all URLs at once  
✅ **Safe** - Only updates specified episode  
✅ **Automatic file detection** - No need to specify file path  
✅ **Git integration** - Changes are automatically committed

Perfect for fixing URLs that the automated system couldn't find! 🎉
