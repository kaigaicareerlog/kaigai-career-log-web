# Spotify URL Finder - Quick Start

## What You Need

1. **Spotify Client ID** (you already have this!)
2. **Spotify Client Secret** (get this from the same place you got your Client ID)

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
```

### Step 2: Run the Script

```bash
npm run find-spotify-url <guid>
```

### Example

```bash
# Set credentials (do this once per terminal session)
export SPOTIFY_CLIENT_ID="abc123def456..."
export SPOTIFY_CLIENT_SECRET="xyz789uvw012..."

# Find Spotify URL for an episode
npm run find-spotify-url cc15a703-73c7-406b-8abc-ad7d0a192d05
```

## What It Does

The script will:

1. ✅ Find the episode title from your `episodes.json` using the GUID
2. ✅ Connect to Spotify API
3. ✅ Get all episodes from your Spotify show
4. ✅ Match the episode by title
5. ✅ Return the Spotify URL

## Output

```
🔍 Searching for episode with GUID: cc15a703-73c7-406b-8abc-ad7d0a192d05

📝 Found episode: "【特別回】なぜ海外就職では..."

🔐 Authenticating with Spotify...
✅ Successfully authenticated with Spotify

🎵 Fetching all episodes from Spotify show...
✅ Found 23 episodes in Spotify

🔎 Searching for matching episode by title...
✅ Found Spotify URL: https://open.spotify.com/episode/1pCYF2Hh9auRtTCELuPK8e
```

## Need More Help?

See the full documentation: [docs/SPOTIFY_URL_FINDER.md](docs/SPOTIFY_URL_FINDER.md)

## What's Next?

Once you get the URL, you can:

- Manually add it to `episodes.json`
- Or we can create a batch update script to update all missing URLs at once
