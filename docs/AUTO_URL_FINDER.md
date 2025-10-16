# Automatic URL Finder for New Episodes

This document explains how the automated URL finding feature works in the RSS update workflow.

## Overview

When the `update-rss` GitHub Action runs and detects new episodes, it automatically:

1. Searches for the episode on Spotify and finds its URL
2. Searches for the episode on YouTube and finds its URL
3. Searches for the episode on Apple Podcasts and finds its URL (no API key needed!)
4. Updates the `episodes.json` file with the discovered URLs

This automation eliminates the manual work of finding and adding URLs for new episodes.

## How It Works

### Workflow Steps

1. **Download RSS Feed** - Fetches the latest RSS feed from Anchor.fm
2. **Convert XML to JSON** - Converts the RSS XML to JSON format
3. **Generate episodes.json** - Creates/updates the episodes file, preserving existing URLs
4. **Find URLs for New Episodes** - ⭐ Automatically finds Spotify, YouTube & Apple Podcasts URLs
5. **Commit Changes** - Saves all changes to the repository

### URL Matching Logic

The script uses intelligent title matching to find episodes:

- **Exact Match**: Looks for exact title matches first
- **Normalized Match**: Removes extra spaces and normalizes characters
- **Partial Match**: Checks if titles contain each other (useful for slight variations)

## Required GitHub Secrets

For Spotify and YouTube URL finding, you need to configure the following secrets in your GitHub repository.

**Note: Apple Podcasts uses the free iTunes Search API and doesn't require any API keys!** 🎉

### Spotify API Credentials (Optional for Spotify URLs)

1. **SPOTIFY_CLIENT_ID**

   - Go to: https://developer.spotify.com/dashboard
   - Create a new app or use an existing one
   - Copy the Client ID

2. **SPOTIFY_CLIENT_SECRET**
   - Same app as above
   - Click "Show Client Secret"
   - Copy the Client Secret

### YouTube API Key (Optional for YouTube URLs)

3. **YOUTUBE_API_KEY**
   - Go to: https://console.cloud.google.com/
   - Create a new project or select an existing one
   - Enable "YouTube Data API v3"
   - Create API Key credentials
   - Copy the API Key

### How to Add Secrets to GitHub

1. Go to your repository on GitHub
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add each secret:
   - Name: `SPOTIFY_CLIENT_ID`
   - Value: Your Spotify Client ID
   - Click "Add secret"
5. Repeat for `SPOTIFY_CLIENT_SECRET` and `YOUTUBE_API_KEY`

## Manual Usage

You can also run the script manually for local testing:

```bash
# Update URLs for all episodes missing URLs in a specific file
npm run update-new-episode-urls public/rss/20251015-1451-episodes.json
```

### Environment Variables for Local Testing

Create a `.env` file in your project root:

```env
# Optional: Only needed for specific platforms
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
YOUTUBE_API_KEY=your_youtube_api_key

# Optional (have default values)
SPOTIFY_SHOW_ID=0bj38cgbe71oCr5Q0emwvA
YOUTUBE_CHANNEL_ID=@kaigaicareerlog
APPLE_PODCAST_ID=1818019572

# Note: Even with no credentials, Apple Podcasts URLs will still be found!
```

## Output Examples

### When New Episodes Are Found

```
🔍 Loading episodes from: public/rss/20251015-1451-episodes.json

📊 Episodes Status:
   Total episodes: 23
   Missing Spotify URLs: 2
   Missing YouTube URLs: 2
   Missing Apple Podcasts URLs: 2

🎵 Updating Spotify URLs...
🔐 Authenticating with Spotify...
✅ Successfully authenticated with Spotify
🎵 Fetching all episodes from Spotify show...
✅ Found 23 episodes in Spotify

   🔎 Processing: "Episode Title 1"
      ✅ Found Spotify URL: https://open.spotify.com/episode/xxx

   📊 Spotify: Updated 2/2 episodes

🎥 Updating YouTube URLs...
🎥 Fetching all videos from YouTube channel...
✅ Found 23 videos in YouTube

   🔎 Processing: "Episode Title 1"
      ✅ Found YouTube URL: https://youtu.be/xxx

   📊 YouTube: Updated 2/2 episodes

🍎 Updating Apple Podcasts URLs...
🍎 Fetching all episodes from Apple Podcasts...
✅ Found 23 episodes in Apple Podcasts

   🔎 Processing: "Episode Title 1"
      ✅ Found Apple Podcasts URL: https://podcasts.apple.com/ca/podcast/...

   📊 Apple Podcasts: Updated 2/2 episodes

✅ Successfully updated episodes file: public/rss/20251015-1451-episodes.json
   Total URLs added: 6

✨ Done!
```

### When All Episodes Already Have URLs

```
🔍 Loading episodes from: public/rss/20251015-1451-episodes.json

📊 Episodes Status:
   Total episodes: 23
   Missing Spotify URLs: 0
   Missing YouTube URLs: 0

✅ All episodes already have URLs!
```

## Troubleshooting

### URLs Not Found

If the script can't find URLs for some episodes:

**Possible Reasons:**

- Episode not yet published on Spotify/YouTube
- Episode title doesn't match exactly
- Episode title has special characters or formatting differences
- API rate limits reached

**Solutions:**

1. Wait a few hours and let the workflow run again (it runs daily)
2. Manually check the episode title on Spotify/YouTube
3. Use the manual update scripts:
   ```bash
   npm run update-spotify-urls <guid>
   npm run update-youtube-urls <guid>
   ```

### API Authentication Failures

If you see authentication errors:

**Spotify:**

- Verify your Client ID and Secret are correct
- Check if your Spotify app is active
- Ensure secrets are properly set in GitHub

**YouTube:**

- Verify your API key is correct
- Check if YouTube Data API v3 is enabled
- Ensure you haven't exceeded the daily quota (10,000 units/day)

### Rate Limits

- **Spotify**:
  - Very generous rate limits
  - Unlikely to hit limits with daily runs
- **YouTube**:
  - 10,000 units per day by default
  - Each search costs ~100 units
  - Can handle ~100 episodes per day
  - Request quota increase if needed: https://console.cloud.google.com/

## Related Scripts

- `scripts/update-new-episode-urls.ts` - Main script (runs in CI/CD)
- `scripts/update-spotify-urls.ts` - Spotify-only updates
- `scripts/update-youtube-urls.ts` - YouTube-only updates
- `scripts/find-spotify-url.ts` - Find URL for a specific episode
- `.github/workflows/update-rss.yml` - GitHub Actions workflow

## Technical Details

### Script Location

- Path: `scripts/update-new-episode-urls.ts`
- Language: TypeScript
- Runtime: Node.js with tsx

### Dependencies

- `src/utils/spotify.ts` - Spotify API utilities
- `src/utils/youtube.ts` - YouTube API utilities
- `dotenv` - Environment variable management

### API Endpoints Used

- **Spotify**:
  - `https://accounts.spotify.com/api/token` (Authentication)
  - `https://api.spotify.com/v1/shows/{id}/episodes` (Get episodes)
- **YouTube**:
  - `https://www.googleapis.com/youtube/v3/channels` (Get channel ID from handle)
  - `https://www.googleapis.com/youtube/v3/search` (Search videos)

## Workflow Schedule

The `update-rss` workflow runs:

- **Automatically**: Every day at 9 AM JST (midnight UTC)
- **Manually**: Can be triggered via GitHub Actions UI

## Monitoring

To check if the automation is working:

1. Go to: **Actions** tab in your GitHub repository
2. Look for: **"Update RSS Feed"** workflow runs
3. Check the logs for the **"Update Spotify and YouTube URLs for new episodes"** step
4. Verify that URLs were found and added

## Future Improvements

Potential enhancements:

- Add support for other podcast platforms (e.g., Apple Podcasts, Amazon Music)
- Implement retry logic for failed API calls
- Add Slack/Discord notifications when new episodes are found
- Cache API responses to reduce quota usage
- Add fuzzy matching scores for better title matching
