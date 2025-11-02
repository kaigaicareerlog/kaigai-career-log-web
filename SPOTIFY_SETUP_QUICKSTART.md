# Platform URL Finder - Quick Start

## What You Need

1. **Spotify Client ID** (you already have this!)
2. **Spotify Client Secret** (get this from the same place you got your Client ID)
3. **YouTube API Key** (optional - for YouTube URLs)

## How to Get Client Secret

1. Go to your Spotify app in [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click on your app name
3. Click "Settings"
4. You'll see:
   - **Client ID**: (you already have this)
   - **Client Secret**: Click "View client secret" to reveal it

## Usage

### Step 1: Set Environment Variables

In your terminal:

```bash
export SPOTIFY_CLIENT_ID="your_client_id_here"
export SPOTIFY_CLIENT_SECRET="your_client_secret_here"
export YOUTUBE_API_KEY="your_youtube_api_key_here"  # Optional
```

### Step 2: Run the Script

```bash
npm run update-new-episode-urls <episodes-file-path>
```

### Example

```bash
# Set credentials (do this once per terminal session)
export SPOTIFY_CLIENT_ID="abc123def456..."
export SPOTIFY_CLIENT_SECRET="xyz789uvw012..."
export YOUTUBE_API_KEY="AIza..."

# Find and update URLs for all platforms at once
npm run update-new-episode-urls public/rss/20251101-1200-episodes.json
```

## What It Does

The script will:

1. ✅ Load the episodes file
2. ✅ Find episodes missing platform URLs
3. ✅ Connect to Spotify, YouTube, Apple Podcasts, and Amazon Music
4. ✅ Match episodes by title across all platforms
5. ✅ Update and save the URLs automatically

## Output

```
🔍 Loading episodes from: public/rss/20251101-1200-episodes.json

📊 Episodes Status:
   Total episodes: 23
   Missing Spotify URLs: 2
   Missing YouTube URLs: 2
   Missing Apple Podcasts URLs: 2

🎵 Updating Spotify URLs...
✅ Successfully authenticated with Spotify
✅ Found 23 episodes in Spotify

🎥 Updating YouTube URLs...
✅ Found 23 videos in YouTube

🍎 Updating Apple Podcasts URLs...
✅ Found 23 episodes in Apple Podcasts

✅ Successfully updated episodes file
   Total URLs added: 6
```

## Need More Help?

See the full documentation: 
- [docs/AUTO_URL_FINDER.md](docs/AUTO_URL_FINDER.md)
- [docs/URL_MANAGEMENT_OVERVIEW.md](docs/URL_MANAGEMENT_OVERVIEW.md)

## What's Next?

The script automatically:

- ✅ Finds URLs for all platforms at once
- ✅ Updates the episodes.json file
- ✅ Works in GitHub Actions for automated updates
