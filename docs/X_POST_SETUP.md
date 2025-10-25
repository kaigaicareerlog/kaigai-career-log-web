# X (Twitter) Post Automation

This document explains how to automatically post episode announcements to X (Twitter) using GitHub Actions.

## Overview

The workflow allows you to post new episode announcements to X with a single click, including:

- Episode title
- Host information with X handles
- Links to all platforms (Apple Podcasts, Spotify, YouTube, Amazon Music)

## Setup

### 1. Get X API Credentials

You need to create an X Developer account and get API credentials with write permissions:

1. Go to [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app (or use an existing one)
3. Set up **User authentication settings**:
   - Go to your app's settings
   - Click "Set up" under "User authentication settings"
   - App permissions: Select **Read and Write** (or **Read and Write and Direct Messages**)
   - Type of App: Choose **Web App, Automated App or Bot**
   - Fill in required URLs (can use placeholder URLs)
   - Save
4. Go to **Keys and tokens** section
5. Generate the following tokens:
   - **API Key and Secret** (Consumer Keys)
   - **Access Token and Secret** (with Read and Write permissions)
6. Copy all credentials (you won't be able to see them again!)

### 2. Add GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each:

**Required secrets:**

- `X_API_KEY` - Your API Key (Consumer Key)
- `X_API_SECRET` - Your API Secret (Consumer Secret)
- `X_ACCESS_TOKEN` - Your Access Token (with Read and Write permissions)
- `X_ACCESS_TOKEN_SECRET` - Your Access Token Secret

**Important:** Make sure your Access Token has **Read and Write** permissions, not just Read-only!

## Usage

### Via GitHub Actions (Recommended)

1. Go to your repository's **Actions** tab
2. Select **Post Episode to X (Twitter)** workflow
3. Click **Run workflow**
4. Fill in the inputs:
   - **Episode GUID**: Enter the episode's GUID (required)
   - **Include @togashi_ryo**: Check if Ryo is a host
   - **Include @onepercentdsgn**: Check if Senna is a host
   - **Include @ayacappuccino**: Check if Ayaka is a host
5. Click **Run workflow**

The workflow will automatically:

- Fetch episode data from the latest episodes file
- Format the main tweet with title, hosts, and hashtags
- Post the main tweet to X
- Post a reply tweet with all platform links (Apple, Spotify, YouTube, Amazon Music)
- Create a clean thread format

### Via Command Line (Local Testing)

```bash
# Export your X API credentials
export X_API_KEY="your_api_key"
export X_API_SECRET="your_api_secret"
export X_ACCESS_TOKEN="your_access_token"
export X_ACCESS_TOKEN_SECRET="your_access_token_secret"

# Post with single host
npm run post-to-x "episode-guid" "@togashi_ryo"

# Post with multiple hosts
npm run post-to-x "episode-guid" "@togashi_ryo, @onepercentdsgn"

# Example with real GUID
npm run post-to-x "d44556c1-c327-4716-bb57-4d0a4ed55e14" "@togashi_ryo, @onepercentdsgn"
```

## Tweet Format

The script creates a thread with two tweets:

### Main Tweet (Tweet 1):

```
🎧Podcast新エピソード公開

[Episode Title]

Host
@togashi_ryo, @onepercentdsgn

#海外 #海外就職 #キャリア
```

### Reply Tweet (Tweet 2):

```
Apple
[Apple Podcast URL]

Spotify
[Spotify URL]

Youtube
[YouTube URL]

Amazon Music
[Amazon Music URL]
```

**Benefits:**

- ✨ Cleaner main tweet focused on the episode announcement
- 🔗 All platform links organized in a reply thread
- 📏 No character limit issues
- 👀 Better readability and engagement

**Note:** X automatically shortens all URLs to t.co links (~23 characters each).

## Troubleshooting

### "X_ACCESS_TOKEN environment variable is required"

Make sure you've added all required secrets (`X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`) to your GitHub repository.

### "X API error: 401 Unauthorized"

This usually means:

- Your Access Token doesn't have **Read and Write** permissions (regenerate with correct permissions)
- Your credentials are invalid or expired
- Your app's authentication settings are not configured correctly

**Solution:**

1. Go to X Developer Portal → Your App → Settings → User authentication settings
2. Make sure "Read and Write" is selected
3. Regenerate your Access Token and Secret
4. Update the GitHub secrets

### "X API error: 403 Forbidden"

Your app may not have the necessary permissions or the endpoint is restricted for your access level.

### "At least one host must be selected"

You must select at least one host checkbox when running the workflow.

### Thread Posting

The script now posts as a thread:

1. **Main tweet**: Episode announcement with title, hosts, and hashtags
2. **Reply tweet**: All platform URLs

This keeps the main tweet clean and avoids character limit issues. Both tweets are posted automatically in sequence.

## API Rate Limits

X API has rate limits for posting:

- **Free tier**: 1,500 tweets per month (50 per day)
- **Basic tier**: 3,000 tweets per month ($100/month)
- **Pro tier**: 10,000 tweets per month

For this podcast announcement workflow, the Free tier should be more than sufficient!

## Tweet URL Shortening

X automatically converts all URLs to t.co short links:

- Each URL becomes ~23 characters regardless of original length
- This happens automatically when you post
- The script shows both the original character count and estimated shortened length
