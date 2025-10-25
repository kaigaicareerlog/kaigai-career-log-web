# Quick Start: Post Episode to X (Twitter)

## 🚀 Quick Guide

Post new podcast episodes to X with one click!

### Setup (One-time)

1. **Get X API credentials** - Go to [developer.twitter.com](https://developer.twitter.com/en/portal/dashboard)
2. **Add 4 secrets** to GitHub → Settings → Secrets and variables → Actions:
   - `X_API_KEY`
   - `X_API_SECRET`
   - `X_ACCESS_TOKEN`
   - `X_ACCESS_TOKEN_SECRET`

> 📖 Detailed setup instructions: See [X_POST_SETUP.md](./X_POST_SETUP.md)

### Usage

1. Go to **Actions** tab in your GitHub repository
2. Click **"Post Episode to X (Twitter)"** workflow
3. Click **"Run workflow"**
4. Fill in:
   - **Episode GUID**: Copy from episodes.json
   - Check the host(s): Ryo, Senna, and/or Ayaka
5. Click **"Run workflow"**

Done! A thread will be posted automatically. 🎉

## Tweet Preview (Thread Format)

### 🧵 Tweet 1 (Main):

```
🎧Podcast新エピソード公開

[Episode Title]

Host
@togashi_ryo, @onepercentdsgn

#海外 #海外就職 #キャリア
```

### 🔗 Tweet 2 (Reply with URLs):

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

**Why a thread?**

- ✨ Cleaner main tweet focused on the announcement
- 📏 No character limit issues
- 🔗 All platform links organized in a reply

## Tips

- ✅ Posts as a thread: main tweet + reply with URLs
- ✅ URLs are auto-shortened by X to t.co links (~23 chars each)
- ✅ Free X API tier allows 1,500 tweets/month (plenty for podcasts!)
- ✅ At least one host must be selected
- ✅ Script automatically fetches episode data and URLs

## Troubleshooting

**Problem:** "X_ACCESS_TOKEN environment variable is required"  
**Solution:** Make sure all 4 secrets are added to GitHub

**Problem:** "401 Unauthorized"  
**Solution:** Your Access Token needs "Read and Write" permissions. Regenerate it with correct permissions.

**Problem:** "Episode with GUID not found"  
**Solution:** Check that the GUID exists in the latest episodes.json file

---

📚 For more details, see [X_POST_SETUP.md](./X_POST_SETUP.md)
