# Manual URL Update - Quick Start Guide

Super quick guide to manually update episode URLs using GitHub Actions.

## 🚀 3-Step Process

### Step 1: Get Episode GUID

Open the latest episodes file on GitHub:

```
https://github.com/YOUR_USERNAME/kaigai-career-log-web/blob/main/public/rss/
```

Find your episode and copy the `guid`:

```json
{
  "title": "Your Episode Title",
  "guid": "cc15a703-73c7-406b-8abc-ad7d0a192d05",  ← Copy this
  "spotifyUrl": "",
  "youtubeUrl": ""
}
```

### Step 2: Get URLs

**Spotify**: Share → Copy Episode Link  
**YouTube**: Copy video URL

### Step 3: Run Workflow

1. Go to **Actions** tab in GitHub
2. Click **"Update Episode URLs Manually"** (left sidebar)
3. Click **"Run workflow"** dropdown (right side)
4. Fill in:
   - **guid**: Paste the GUID
   - **spotify_url**: Paste Spotify URL (optional)
   - **youtube_url**: Paste YouTube URL (optional)
5. Click **"Run workflow"**
6. Wait ~30 seconds ✅

## 📋 Example

```
guid: cc15a703-73c7-406b-8abc-ad7d0a192d05
spotify_url: https://open.spotify.com/episode/1pCYF2Hh9auRtTCELuPK8e
youtube_url: https://youtu.be/z0jJm4cqHbA
```

## ✅ That's It!

The workflow will:

- Find your episode
- Update the URLs
- Commit the changes
- All in ~30 seconds

## 📚 Need More Help?

See the detailed guide: [MANUAL_URL_UPDATE.md](./MANUAL_URL_UPDATE.md)

## 🔧 Common Issues

**"Episode not found"**  
→ Double-check the GUID (include all hyphens)

**"No URLs provided"**  
→ Fill in at least one URL field

**Workflow doesn't start**  
→ Make sure you clicked the final green "Run workflow" button

---

**That's it!** Simple and fast. 🎉
