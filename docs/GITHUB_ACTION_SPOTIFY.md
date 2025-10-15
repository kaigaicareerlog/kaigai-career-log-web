# GitHub Action: Update Episode URLs

This GitHub Action finds and updates platform URLs (Spotify, YouTube, Apple Podcasts, Amazon Music) for your podcast episodes and creates a Pull Request with the changes.

## 📋 Table of Contents

- [Features](#features)
- [Setup](#setup)
- [Usage](#usage)
- [How It Works](#how-it-works)
- [Troubleshooting](#troubleshooting)

## ✨ Features

- 🎯 **Manual Trigger**: Run on-demand when you need to update URLs
- 🎵 **Multi-Platform**: Support for Spotify (with more platforms coming soon)
- 📝 **Batch or Single**: Update all episodes or a specific one by GUID
- 🔄 **Pull Request Creation**: Automatically creates a PR with the changes
- 🏷️ **Smart Labeling**: PRs are automatically labeled for easy filtering
- 🔐 **Secure**: Uses GitHub Secrets for API credentials

## 🛠️ Setup

### Step 1: Add GitHub Secrets

You need to add your Spotify API credentials as GitHub Secrets:

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

   | Name                    | Value                      |
   | ----------------------- | -------------------------- |
   | `SPOTIFY_CLIENT_ID`     | Your Spotify Client ID     |
   | `SPOTIFY_CLIENT_SECRET` | Your Spotify Client Secret |

#### How to Get Spotify Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **Create App**
4. Fill in the app details:
   - **App name**: Your choice (e.g., "Podcast URL Finder")
   - **App description**: Your choice
   - **Redirect URIs**: Not needed for this use case
5. Click **Save**
6. You'll see your **Client ID** and **Client Secret** (click "View client secret")

### Step 2: Verify Workflow File

The workflow file should already be in your repository at:

```
.github/workflows/update-episode-urls.yml
```

If it's not there, create it with the content from this repository.

### Step 3: Test the Setup

1. Go to your GitHub repository
2. Click on **Actions** tab
3. Click on **Update Episode URLs** workflow
4. Click **Run workflow**
5. Select platform: **spotify**
6. Leave the GUID field empty to update all episodes
7. Click **Run workflow**

## 🚀 Usage

### Manual Trigger - Update All Episodes

To update all episodes missing URLs:

1. Go to **Actions** → **Update Episode URLs**
2. Click **Run workflow**
3. Select the **platform** (currently only Spotify is supported)
4. Leave the GUID field **empty**
5. Click **Run workflow**

### Manual Trigger - Update Specific Episode

To update a specific episode:

1. Find the episode GUID from your `episodes.json` file
2. Go to **Actions** → **Update Episode URLs**
3. Click **Run workflow**
4. Select the **platform** (spotify)
5. Enter the **GUID** in the input field
6. Click **Run workflow**

Example GUID: `cc15a703-73c7-406b-8abc-ad7d0a192d05`

### Available Platforms

Currently supported:

- ✅ **Spotify** - Fully functional

Coming soon:

- 🔜 **YouTube** - In development
- 🔜 **Apple Podcasts** - In development
- 🔜 **Amazon Music** - In development

## 🔄 How It Works

### Workflow Steps

1. **Checkout Repository**: Gets the latest code
2. **Setup Node.js**: Installs Node.js 20
3. **Install Dependencies**: Installs npm packages
4. **Update Episode URLs**: Runs the update script based on selected platform
   - For Spotify: Uses Spotify API credentials
   - For other platforms: (Coming soon)
5. **Check for Changes**: Verifies if any files were modified
6. **Create Pull Request**: Creates a PR if changes were detected

### The Update Script

The script (`scripts/update-spotify-urls.ts`):

1. Loads your `episodes.json` file
2. Finds episodes without `spotifyUrl`
3. Authenticates with Spotify API
4. Fetches all episodes from your Spotify show
5. Matches episodes by title (tries exact, normalized, and partial matches)
6. Updates the `episodes.json` file
7. Reports a summary of updates

### Pull Request Details

When changes are detected, the workflow creates a PR with:

- **Branch name**: `automated/update-episode-urls`
- **Title**: 🔗 Update Episode URLs ({platform})
- **Labels**: `automated`, `episode-urls`, `enhancement`
- **Description**: Details about what was updated, including the platform

## 🐛 Troubleshooting

### Workflow Fails with "SPOTIFY_CLIENT_ID not found"

**Solution**: Make sure you've added the secrets correctly in GitHub Settings:

- Repository → Settings → Secrets and variables → Actions
- The secret names must be exactly: `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`

### No Pull Request Created

**Possible reasons**:

1. **No episodes need updating**: All episodes already have Spotify URLs
2. **Episodes not found on Spotify**: The episode titles don't match any on Spotify

Check the workflow logs for details.

### Episode Title Doesn't Match

The script tries three matching strategies:

1. **Exact match**: Title must match exactly
2. **Normalized match**: Removes extra spaces and normalizes
3. **Partial match**: One title contains the other

If an episode still isn't found:

- Check if the episode is published on Spotify
- Verify the title matches (you can check manually on Spotify)
- The episode might have a different title on Spotify

### Permission Denied Errors

The workflow uses `GITHUB_TOKEN` which has limited permissions. If you see permission errors:

1. Go to Repository → Settings → Actions → General
2. Under "Workflow permissions", select:
   - ✅ **Read and write permissions**
3. Save the changes

### Testing Locally

You can test the update script locally:

```bash
# Update all episodes
npm run update-spotify-urls

# Update specific episode
npm run update-spotify-urls cc15a703-73c7-406b-8abc-ad7d0a192d05
```

Make sure you have a `.env` file with your credentials:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

## 📚 Related Documentation

- [SPOTIFY_URL_FINDER.md](SPOTIFY_URL_FINDER.md) - Manual Spotify URL finding
- [SPOTIFY_SETUP_QUICKSTART.md](../SPOTIFY_SETUP_QUICKSTART.md) - Quick setup guide

## 🤝 Need Help?

If you encounter issues:

1. Check the workflow logs in the Actions tab
2. Review the troubleshooting section above
3. Test the script locally to isolate the issue
4. Check that your Spotify app has the correct permissions

## 📝 Customization

### Add Automatic Schedule (Optional)

The workflow is currently manual-only. If you want it to run automatically, edit `.github/workflows/update-episode-urls.yml` and add a schedule section:

```yaml
on:
  workflow_dispatch:
    # ... existing inputs ...
  schedule:
    # Run daily at 2:00 AM UTC
    - cron: "0 2 * * *"
    # Or run weekly on Mondays at 9:00 AM UTC
    - cron: "0 9 * * 1"
```

Use [crontab.guru](https://crontab.guru/) to create cron schedules.

### Customize PR Labels

Edit the workflow file to change the PR labels:

```yaml
labels: |
  automated
  episode-urls
  enhancement
  your-custom-label
```

### Change Branch Name

To use a different branch name for PRs:

```yaml
branch: automated/episode-urls-updates
```

### Add Support for More Platforms

To add support for YouTube, Apple Podcasts, or Amazon Music, you'll need to:

1. Create a new script similar to `update-spotify-urls.ts` for that platform
2. Add the API credentials to GitHub Secrets
3. Update the workflow to call your new script when that platform is selected
4. Update the workflow's `Update Episode URLs` step to handle the new platform

---

Happy automating! 🎉
