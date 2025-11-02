# GitHub Secrets Setup Guide

This guide walks you through setting up the required GitHub secrets for automatic URL finding in the RSS update workflow.

## Quick Setup Checklist

- [ ] Create Spotify App and get credentials
- [ ] Create YouTube API key
- [ ] Add secrets to GitHub repository
- [ ] Test the workflow

---

## Part 1: Spotify API Setup (5-10 minutes)

### Step 1: Create Spotify Developer Account

1. Go to [Spotify for Developers](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account (create one if needed)
3. Accept the Terms of Service if prompted

### Step 2: Create a Spotify App

1. Click **"Create app"** button
2. Fill in the form:
   - **App name**: `Kaigai Career Log URL Finder` (or any name you prefer)
   - **App description**: `Automated tool to find podcast episode URLs`
   - **Website**: Your podcast website URL (e.g., `https://kaigaicareerlog.com`)
   - **Redirect URI**: `http://localhost:3000` (required but not used)
   - Check the box: **"I understand and agree with Spotify's Developer Terms of Service and Design Guidelines"**
3. Click **"Save"**

### Step 3: Get Your Spotify Credentials

1. Click on your newly created app
2. Click **"Settings"** button in the top-right
3. You'll see:
   - **Client ID**: Copy this value (looks like: `abc123def456...`)
   - **Client secret**: Click "View client secret" → Copy this value

**Save these values** - you'll need them in Part 3!

---

## Part 2: YouTube API Setup (10-15 minutes)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click the project dropdown at the top
4. Click **"New Project"**
5. Enter project details:
   - **Project name**: `Kaigai Career Log`
   - **Organization**: (Leave as default or select your org)
6. Click **"Create"**
7. Wait for the project to be created (~10 seconds)

### Step 2: Enable YouTube Data API v3

1. Make sure your new project is selected (check top dropdown)
2. In the search bar, type: `YouTube Data API v3`
3. Click on **"YouTube Data API v3"**
4. Click the **"Enable"** button
5. Wait for it to enable (~5 seconds)

### Step 3: Create API Key

1. In the left sidebar, click **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"API key"**
4. Your API key will be created and shown in a popup
5. **Copy the API key** (looks like: `AIzaSyA...`)
6. (Optional but recommended) Click **"Restrict Key"**:
   - **Name**: `YouTube URL Finder Key`
   - **API restrictions**: Select "Restrict key"
   - Check only: **YouTube Data API v3**
   - Click **"Save"**

**Save this API key** - you'll need it in Part 3!

### Step 4: (Optional) Check Your Quota

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. In the left sidebar: **APIs & Services** → **Enabled APIs & services**
3. Click **"YouTube Data API v3"**
4. Click **"Quotas & System Limits"** tab
5. Default quota is **10,000 units/day** (enough for ~100 episodes/day)
6. If you need more, click **"Request quota increase"**

---

## Part 3: Add Secrets to GitHub

Now that you have all the credentials, let's add them to GitHub:

### Step 1: Navigate to Repository Secrets

1. Go to your GitHub repository: `github.com/YOUR_USERNAME/kaigai-career-log-web`
2. Click **"Settings"** tab (top-right of repository)
3. In left sidebar: Click **"Secrets and variables"** → **"Actions"**

### Step 2: Add SPOTIFY_CLIENT_ID

1. Click **"New repository secret"**
2. **Name**: `SPOTIFY_CLIENT_ID`
3. **Secret**: Paste your Spotify Client ID (from Part 1, Step 3)
4. Click **"Add secret"**

### Step 3: Add SPOTIFY_CLIENT_SECRET

1. Click **"New repository secret"**
2. **Name**: `SPOTIFY_CLIENT_SECRET`
3. **Secret**: Paste your Spotify Client Secret (from Part 1, Step 3)
4. Click **"Add secret"**

### Step 4: Add YOUTUBE_API_KEY

1. Click **"New repository secret"**
2. **Name**: `YOUTUBE_API_KEY`
3. **Secret**: Paste your YouTube API Key (from Part 2, Step 3)
4. Click **"Add secret"**

### Verify All Secrets Are Added

You should now see 3 secrets in the list:

- ✅ `SPOTIFY_CLIENT_ID`
- ✅ `SPOTIFY_CLIENT_SECRET`
- ✅ `YOUTUBE_API_KEY`

---

## Part 4: Test the Setup

### Option 1: Manual Workflow Trigger

1. Go to your repository on GitHub
2. Click **"Actions"** tab
3. Click **"Update RSS Feed"** workflow (left sidebar)
4. Click **"Run workflow"** dropdown (right side)
5. Click **"Run workflow"** button
6. Wait for the workflow to complete (~1-2 minutes)
7. Check the logs for the **"Update Spotify and YouTube URLs for new episodes"** step
8. Look for success messages like:
   ```
   ✅ Successfully updated episodes file
   ```

### Option 2: Wait for Scheduled Run

The workflow automatically runs every day at 9 AM JST (midnight UTC).

Just wait until tomorrow and check the **Actions** tab to see if it ran successfully.

### Option 3: Test Locally (Advanced)

If you want to test locally before pushing:

1. Create a `.env` file in your project root:

   ```env
   SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

2. Run the script:

   ```bash
   npm run update-new-episode-urls public/rss/20251015-1451-episodes.json
   ```

3. Check the console output for success/error messages

---

## Troubleshooting

### "Missing required environment variables" Error

**Problem**: The workflow fails with this error.

**Solution**:

1. Double-check that all 3 secrets are added to GitHub
2. Verify the secret names are EXACTLY:
   - `SPOTIFY_CLIENT_ID` (not `SPOTIFY_ID` or similar)
   - `SPOTIFY_CLIENT_SECRET`
   - `YOUTUBE_API_KEY`
3. Secret names are case-sensitive!

### "Spotify API error: Invalid client" Error

**Problem**: Spotify authentication fails.

**Solution**:

1. Go to [Spotify Dashboard](https://developer.spotify.com/dashboard)
2. Click on your app → Settings
3. Verify your Client ID and Secret
4. Copy them again and update GitHub secrets
5. Make sure there are no extra spaces when copying

### "YouTube API error: 403 Forbidden" Error

**Problem**: YouTube API is not accessible.

**Solution**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure YouTube Data API v3 is enabled
3. Check that API restrictions allow YouTube Data API v3
4. Verify your API key is correct
5. Check you haven't exceeded the daily quota (10,000 units)

### "YouTube API error: 429 Too Many Requests" Error

**Problem**: You've exceeded the API quota.

**Solution**:

1. Wait until the quota resets (next day at midnight Pacific Time)
2. Or request a quota increase from Google Cloud Console
3. The workflow will work again after the quota resets

### Workflow Runs But No URLs Are Added

**Problem**: The workflow completes successfully but no URLs are found.

**Possible Reasons**:

1. **Episodes not published yet**: Wait a few hours after RSS feed updates
2. **Title mismatch**: Episode titles in RSS feed don't match Spotify/YouTube
3. **Already have URLs**: All episodes already have URLs (check episodes.json)

**Solution**:

1. Check the workflow logs for detailed messages
2. Manually verify episode titles on Spotify/YouTube
3. If needed, manually re-run the update script:
   ```bash
   npm run update-new-episode-urls public/rss/[episodes-file].json
   ```

---

## Security Best Practices

### Do's ✅

- ✅ Keep your secrets in GitHub Secrets (never commit to code)
- ✅ Use API key restrictions when possible (YouTube)
- ✅ Regularly rotate your credentials (every 6-12 months)
- ✅ Only grant necessary permissions to API keys

### Don'ts ❌

- ❌ Never commit `.env` files to Git (add to `.gitignore`)
- ❌ Don't share your credentials in issues/pull requests
- ❌ Don't use the same credentials across multiple projects
- ❌ Don't store credentials in code comments

---

## Quota Information

### Spotify API

- **Rate Limit**: Very generous, unlikely to hit limits
- **Daily Quota**: No strict daily limits for basic usage
- **Cost**: Free tier is sufficient

### YouTube Data API v3

- **Daily Quota**: 10,000 units by default
- **Cost per search**: ~100 units
- **Episodes per day**: Can handle ~100 episodes
- **Overage**: Free tier, but stops working when quota exceeded
- **Quota increase**: Can request more from Google Cloud Console

### Recommendations

- Current setup is fine for daily updates
- If you publish more than 50 episodes per day, request YouTube quota increase
- Monitor usage in Google Cloud Console

---

## Need Help?

If you encounter any issues:

1. **Check the logs**: Go to Actions tab → Click on failed workflow → Read error messages
2. **Verify secrets**: Settings → Secrets → Ensure all 3 are present
3. **Test APIs separately**:
   - Test Spotify: `npm run find-spotify-url <guid>`
   - Test all platforms: `npm run update-new-episode-urls public/rss/[episodes-file].json`
4. **Check documentation**:
   - [Spotify Web API Docs](https://developer.spotify.com/documentation/web-api)
   - [YouTube Data API Docs](https://developers.google.com/youtube/v3)
5. **Review detailed docs**: See `docs/AUTO_URL_FINDER.md` for more information

---

## Summary

Once you've completed all steps:

✅ Spotify app created and credentials obtained  
✅ YouTube API enabled and key created  
✅ All secrets added to GitHub  
✅ Workflow tested and working

**Result**: Every time a new episode is published and RSS feed updates, the workflow will automatically find and add Spotify and YouTube URLs to your episodes.json file! 🎉
