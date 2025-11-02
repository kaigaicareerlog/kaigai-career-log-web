# Spotify URL Finder

This tool allows you to find Spotify episode URLs by providing a GUID from your episodes.json file.

## How It Works

The script follows these steps:

1. Gets the episode title from `episodes.json` using the provided GUID
2. Authenticates with Spotify API using Client Credentials
3. Fetches all episodes from your Spotify show
4. Searches for a matching episode by title
5. Returns the Spotify URL

## Setup

### 1. Get Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create app"
3. Fill in the details:
   - **App name**: Kaigai Career Log URL Finder (or any name)
   - **App description**: Script to find episode URLs
   - **Redirect URI**: `http://localhost` (won't be used, but required by the form)
4. Click "Create"
5. You'll see your **Client ID** and **Client Secret**

### 2. Find Your Spotify Show ID

Your Show ID can be found in your Spotify show URL:

```
https://open.spotify.com/show/YOUR_SHOW_ID
```

For example, your show URL is:

```
https://open.spotify.com/show/0bj38cgbe71oCr5Q0emwvA
```

Your Show ID is `0bj38cgbe71oCr5Q0emwvA`.

### 3. Set Environment Variables

Create a `.env` file in the project root (or export them in your terminal):

```bash
export SPOTIFY_CLIENT_ID="your_client_id_here"
export SPOTIFY_CLIENT_SECRET="your_client_secret_here"
export SPOTIFY_SHOW_ID="0bj38cgbe71oCr5Q0emwvA"  # Optional, already set as default
```

## Usage

### Find and Update Platform URLs

```bash
npm run update-new-episode-urls <episodes-file-path>
```

Example:

```bash
export SPOTIFY_CLIENT_ID="abc123..."
export SPOTIFY_CLIENT_SECRET="xyz789..."
npm run update-new-episode-urls public/rss/20251101-1200-episodes.json
```

### Output Example

```
🔍 Searching for episode with GUID: cc15a703-73c7-406b-8abc-ad7d0a192d05

📝 Found episode: "【特別回】なぜ海外就職では日本の常識が通用しない？..."

🔐 Authenticating with Spotify...
✅ Successfully authenticated with Spotify

🎵 Fetching all episodes from Spotify show...
✅ Found 23 episodes in Spotify

🔎 Searching for matching episode by title...
✅ Found Spotify URL: https://open.spotify.com/episode/1pCYF2Hh9auRtTCELuPK8e
```

## Troubleshooting

### Error: "SPOTIFY_CLIENT_ID environment variable is required"

Make sure you've set the environment variables:

```bash
export SPOTIFY_CLIENT_ID="your_client_id"
export SPOTIFY_CLIENT_SECRET="your_client_secret"
```

### Error: "Episode with GUID not found"

The GUID doesn't exist in your `episodes.json` file. Check that:

- The GUID is correct
- You're using the latest episodes.json file

### Error: "Could not find matching episode in Spotify"

This could mean:

- The episode title in `episodes.json` doesn't exactly match the Spotify title
- The episode hasn't been published to Spotify yet
- The title has special characters that don't match

The script tries:

1. Exact match
2. Normalized match (removing extra spaces)
3. Partial match (contains)

If none work, you may need to manually check the title in Spotify.

## Technical Details

### API Functions Used

From `src/utils/spotify.ts`:

- `getSpotifyAccessToken(clientId, clientSecret)`: Authenticates with Spotify
- `getSpotifyShowEpisodes(showId, accessToken)`: Fetches all episodes from your show
- `findSpotifyEpisodeByTitle(episodes, title)`: Matches episode by title

### Title Matching Strategy

The script uses three matching strategies in order:

1. **Exact match**: Title matches exactly
2. **Normalized match**: Titles match after trimming and normalizing spaces
3. **Partial match**: One title contains the other

This handles minor differences in spacing or formatting.

## Future Enhancements

Potential improvements:

- Batch update all missing Spotify URLs at once
- Interactive mode to confirm matches
- Fuzzy matching for better title matching
- Automatically update `episodes.json` with found URLs
