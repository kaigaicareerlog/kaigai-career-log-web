# URL Management System Overview

Complete guide to managing podcast episode URLs in the Kaigai Career Log project.

## System Components

The project has three methods for managing episode URLs:

1. **🤖 Automatic URL Discovery** - Daily automated finding of URLs for new episodes
2. **✋ Manual URL Update** - GitHub Actions workflow for quick manual updates
3. **🔧 Script-Based Tools** - Command-line scripts for local development

## When to Use Each Method

### 🤖 Automatic URL Discovery

**Use when**:

- Publishing new episodes regularly
- Want hands-off URL management
- Episodes are published on Spotify & YouTube with matching titles

**How it works**:

- Runs automatically every day at 9 AM JST
- Detects new episodes in RSS feed
- Searches Spotify and YouTube for matching episodes
- Updates episodes.json automatically

**Documentation**: [AUTO_URL_FINDER.md](./AUTO_URL_FINDER.md)

---

### ✋ Manual URL Update Workflow

**Use when**:

- Need to fix an incorrect URL quickly
- Automatic finder couldn't match an episode
- Want to add URLs immediately without waiting
- Episode titles don't match between platforms

**How it works**:

- Go to GitHub Actions → "Update Episode URLs Manually"
- Enter episode GUID and URLs
- Changes committed automatically in ~30 seconds

**Documentation**: [MANUAL_URL_UPDATE.md](./MANUAL_URL_UPDATE.md)

---

### 🔧 Script-Based Tools

**Use when**:

- Developing or testing locally
- Need to batch update multiple episodes
- Want more control over the update process
- Debugging URL matching issues

**Available scripts**:

- `update-episode-by-guid` - Update specific episode with any URLs
- `update-spotify-urls` - Update all missing Spotify URLs
- `update-youtube-urls` - Update all missing YouTube URLs
- `update-apple-urls` - Update all missing Apple Podcasts URLs (no API key needed!)
- `update-new-episode-urls` - Update Spotify, YouTube & Apple Podcasts for new episodes
- `find-spotify-url` - Find Spotify URL for an episode (read-only)

**Documentation**: [SPOTIFY_URL_FINDER.md](./SPOTIFY_URL_FINDER.md)

---

## Quick Decision Guide

```
Need to update URLs?
│
├─ Is it a new episode?
│  ├─ Yes → Wait for automatic workflow (runs daily at 9 AM JST)
│  └─ Is it urgent? → Use Manual Update Workflow
│
├─ Is it a correction/fix?
│  └─ Use Manual Update Workflow
│
├─ Are you testing/developing?
│  └─ Use Script-Based Tools
│
└─ Need to update many episodes?
   └─ Use Script-Based Tools with iteration
```

## Setup Requirements

### For Automatic Discovery

**Required GitHub Secrets**:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `YOUTUBE_API_KEY`

**Setup Guide**: [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)

### For Manual Update

**Required**:

- Write access to GitHub repository
- Know the episode GUID
- Have the URLs to add

**No API keys needed** - Just uses Git!

### For Script-Based Tools

**Required**:

- Node.js installed locally
- `.env` file with API credentials (for Spotify/YouTube scripts)
- Episodes.json file path

## Workflow Comparison

| Feature           | Automatic          | Manual Workflow    | Scripts             |
| ----------------- | ------------------ | ------------------ | ------------------- |
| **Speed**         | Daily (scheduled)  | ~30 seconds        | Instant             |
| **Setup**         | Requires API keys  | No setup           | Requires API keys\* |
| **Use case**      | Regular automation | Quick fixes        | Development/Testing |
| **Bulk updates**  | Yes (all new)      | No (one at a time) | Yes (scriptable)    |
| **Location**      | GitHub Actions     | GitHub Actions     | Local machine       |
| **Requires code** | No                 | No                 | Yes                 |

\* Only for Spotify/YouTube scripts. GUID-based script doesn't need API keys.

## File Structure

```
kaigai-career-log-web/
├── .github/workflows/
│   ├── update-rss.yml                    # Automatic RSS + URL updates
│   └── update-urls-manually.yml          # Manual URL update workflow
├── scripts/
│   ├── update-new-episode-urls.ts        # Auto-find URLs for new episodes
│   ├── update-episode-by-guid.ts         # Update specific episode by GUID
│   ├── update-spotify-urls.ts            # Batch Spotify URL updates
│   ├── update-youtube-urls.ts            # Batch YouTube URL updates
│   ├── find-spotify-url.ts               # Find Spotify URL (read-only)
│   └── find-latest-episodes.ts           # Helper: find latest episodes file
├── src/utils/
│   ├── spotify.ts                        # Spotify API utilities
│   └── youtube.ts                        # YouTube API utilities
├── public/rss/
│   └── YYYYMMDD-HHMM-episodes.json       # Episodes data (timestamped)
└── docs/
    ├── AUTO_URL_FINDER.md                # Automatic discovery guide
    ├── MANUAL_URL_UPDATE.md              # Manual workflow guide
    ├── GITHUB_SECRETS_SETUP.md           # Setup instructions
    └── URL_MANAGEMENT_OVERVIEW.md        # This file
```

## Common Tasks

### Task: Add URLs for a brand new episode

**Method**: Automatic (preferred)

1. Publish episode on Spotify & YouTube
2. Wait for RSS feed to update
3. Automatic workflow runs at 9 AM JST
4. URLs added automatically

**Alternative**: Manual Workflow (if urgent)

1. Find episode GUID in episodes.json
2. Get URLs from Spotify & YouTube
3. Run "Update Episode URLs Manually" workflow
4. Done in ~30 seconds

### Task: Fix wrong URL for an episode

**Method**: Manual Workflow

1. Find episode GUID in episodes.json
2. Get correct URL
3. Run "Update Episode URLs Manually" workflow
4. Enter GUID and correct URL

### Task: Add URLs for 10 old episodes

**Method**: Scripts

1. Set up `.env` with API credentials
2. Run for each episode:
   ```bash
   npm run update-spotify-urls <guid>
   npm run update-youtube-urls <guid>
   ```
3. Or create a bash loop to process all

### Task: Check if episode has Spotify URL

**Method**: Scripts (read-only)

```bash
npm run find-spotify-url <guid>
```

This won't update the file, just shows you the URL.

## Best Practices

### ✅ Recommended Workflow

1. **Set up automatic discovery** first (one-time setup)
2. **Let automation handle new episodes** (daily)
3. **Use manual workflow for exceptions** (when needed)
4. **Use scripts for development** (local testing)

### 🎯 Tips for Success

- **Consistent titles**: Use the same title across all platforms
- **Publish everywhere**: Ensure episodes are on Spotify, YouTube & Apple Podcasts
- **Check logs**: Review GitHub Actions logs to see what happened
- **Test locally first**: Use scripts to test before pushing changes
- **Keep secrets secure**: Never commit API keys to Git
- **Apple Podcasts bonus**: Works automatically with no setup required!

### ⚠️ Common Pitfalls

- ❌ **Title mismatches**: Different titles prevent automatic matching
- ❌ **Publishing delays**: YouTube might take hours to index
- ❌ **API quotas**: YouTube has daily limits (10,000 units)
- ❌ **Wrong GUID**: Copy-paste errors cause "not found" errors
- ❌ **Missing secrets**: Workflow fails without API credentials

## Troubleshooting Decision Tree

```
Having issues?
│
├─ Automatic discovery not working?
│  ├─ Are GitHub Secrets set up? → See GITHUB_SECRETS_SETUP.md
│  ├─ Are titles identical? → Check Spotify vs YouTube titles
│  └─ Check workflow logs → Actions tab → Latest run
│
├─ Manual workflow failing?
│  ├─ Wrong GUID? → Verify in episodes.json
│  ├─ Invalid URL? → Must start with https://
│  └─ Permission error? → Need write access to repo
│
└─ Script errors locally?
   ├─ Missing .env? → Create with API credentials
   ├─ File not found? → Check path to episodes.json
   └─ API errors? → Verify API keys are valid
```

## Monitoring & Maintenance

### Daily Checks

1. **Go to**: Actions tab on GitHub
2. **Look for**: "Update RSS Feed" workflow runs
3. **Check**: "Update Spotify and YouTube URLs for new episodes" step
4. **Verify**: URLs were found and added

### Weekly Review

1. Open latest `episodes.json`
2. Check recent episodes have all URLs filled
3. Fix any missing URLs using manual workflow

### Monthly Tasks

1. Review GitHub Actions usage (free tier: 2,000 minutes/month)
2. Check YouTube API quota usage (10,000 units/day)
3. Rotate API credentials if needed (every 6-12 months)

## API Usage & Costs

### Spotify API

- **Cost**: Free
- **Limits**: Very generous, unlikely to hit
- **Quota**: No strict daily limits

### YouTube API

- **Cost**: Free tier included
- **Daily Quota**: 10,000 units
- **Per Search**: ~100 units
- **Capacity**: ~100 episodes/day
- **Overage**: Free tier stops working, no charges

### GitHub Actions

- **Free tier**: 2,000 minutes/month for private repos
- **Public repos**: Unlimited
- **Usage**: ~2 minutes/day for all workflows

## Migration Guide

### From Manual URL Management

**Before**: Manually editing episodes.json file
**After**: Use Manual Update Workflow

**Benefits**:

- No need to clone repository
- Automatic Git commits
- Easier for team members
- Prevents merge conflicts

### From Separate Scripts

**Before**: Running individual scripts for each platform
**After**: Use automatic discovery

**Benefits**:

- Runs automatically daily
- Handles both platforms at once
- No manual intervention needed
- Consistent results

## Support & Resources

### Documentation

- [AUTO_URL_FINDER.md](./AUTO_URL_FINDER.md) - Automatic system
- [MANUAL_URL_UPDATE.md](./MANUAL_URL_UPDATE.md) - Manual workflow
- [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) - Setup guide
- [SPOTIFY_URL_FINDER.md](./SPOTIFY_URL_FINDER.md) - Spotify integration

### External Resources

- [Spotify Web API Docs](https://developer.spotify.com/documentation/web-api)
- [YouTube Data API Docs](https://developers.google.com/youtube/v3)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

### Getting Help

1. Check documentation above
2. Review workflow logs in Actions tab
3. Test locally with scripts
4. Check API status pages:
   - [Spotify Status](https://developer.spotify.com/status)
   - [Google Cloud Status](https://status.cloud.google.com/)

## Summary

Three powerful ways to manage URLs:

1. **🤖 Automatic**: Set it and forget it
2. **✋ Manual**: Quick fixes when needed
3. **🔧 Scripts**: Full control for development

Choose the right tool for the job, and your episode URLs will always be up to date! 🎉
