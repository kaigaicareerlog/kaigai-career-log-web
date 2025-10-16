# Transcript Cleanup Options (Free AI)

Clean up your Japanese transcripts with **free AI**. Includes **cost protection**!

## Quick Start

### GitHub Actions (Recommended)

The cleanup happens automatically when you use GitHub Actions!

1. Go to Actions → Transcribe Episode
2. Enter Episode GUID
3. Choose cleanup method (groq or gemini)
4. Run workflow - transcription + cleanup done automatically! ✨

### Local Usage

```bash
# 1. Transcribe first (creates raw transcript)
tsx scripts/transcribe-episode.ts <guid>

# 2. Then clean it up (choose one method)
tsx scripts/cleanup-transcript.ts <guid> groq     # FREE AI (Groq)
tsx scripts/cleanup-transcript.ts <guid> gemini   # FREE AI (Google)
```

---

## Methods Comparison

| Method     | Cost | Quality  | Speed | Setup Time |
| ---------- | ---- | -------- | ----- | ---------- |
| **groq**   | FREE | ⭐⭐⭐⭐ | Fast  | 5 min      |
| **gemini** | FREE | ⭐⭐⭐⭐ | Fast  | 5 min      |

---

## Option 1: Groq (Free AI)

**FREE tier is very generous!**

### Setup (5 minutes)

1. Get free API key: https://console.groq.com/
2. Set environment variable:
   ```bash
   export GROQ_API_KEY="gsk_..."
   ```

### Usage

```bash
tsx scripts/cleanup-transcript.ts <guid> groq
```

**Free tier limits:**

- 30 requests/minute
- 6,000 requests/day
- **Perfect for podcasts!**

---

## Option 2: Google Gemini (Free AI)

**FREE tier with 1,500 requests/day!**

### Setup (5 minutes)

1. Get free API key: https://makersuite.google.com/app/apikey
2. Set environment variable:
   ```bash
   export GEMINI_API_KEY="AIza..."
   ```

### Usage

```bash
tsx scripts/cleanup-transcript.ts <guid> gemini
```

**Free tier limits:**

- 15 requests/minute
- 1,500 requests/day
- **Great for podcasts!**

---

## Cost Protection 🛡️

The script includes automatic cost protection:

```bash
# Set max cost (default: $0.50)
MAX_CLEANUP_COST=1.00 tsx scripts/cleanup-transcript.ts <guid> groq
```

**What happens:**

- Script tracks estimated costs
- Stops automatically if limit reached
- Saves partial results
- You can resume later

**Note:** Groq and Gemini free tiers are **$0** cost!

---

## Which One Should I Use?

### Use **groq** if:

- You want excellent AI quality
- Fast processing speed (Llama 3.1 70B)
- Higher rate limits (30 req/min)

### Use **gemini** if:

- You want excellent AI quality
- You already use Google services
- Prefer Google's AI models

---

## Example Workflow

```bash
# Step 1: Transcribe (once)
export ASSEMBLYAI_API_KEY="your-key"
tsx scripts/transcribe-episode.ts cc15a703-73c7-406b-8abc-ad7d0a192d05

# Step 2: Clean up with AI (setup Groq)
export GROQ_API_KEY="gsk_..."
tsx scripts/cleanup-transcript.ts cc15a703-73c7-406b-8abc-ad7d0a192d05 groq

# Done! Check the result on your episode page
```

---

## Cost Estimates

For a typical 50-minute podcast (~400 utterances):

| Method | Time   | API Calls | Cost               |
| ------ | ------ | --------- | ------------------ |
| groq   | 15 min | 400       | **$0** (free tier) |
| gemini | 8 min  | 400       | **$0** (free tier) |

---

## Troubleshooting

### "GROQ_API_KEY not set"

```bash
# Make sure you exported it
export GROQ_API_KEY="gsk_..."

# Or add to .env file
echo 'GROQ_API_KEY=gsk_...' >> .env
```

### "Rate limit exceeded"

- **Groq:** Wait 1 minute, try again (30 req/min limit)
- **Gemini:** Wait 1 minute, try again (15 req/min limit)
- Script already includes delays to avoid this

### "Cost limit reached"

```bash
# Increase the limit
MAX_CLEANUP_COST=2.00 tsx scripts/cleanup-transcript.ts <guid> groq

# Or just use free tier (no cost anyway!)
```

---

## Tips

✅ **Both options are excellent**

- Groq and Gemini both use advanced AI
- Both are completely FREE
- Choose based on preference

✅ **Free tiers are very generous**

- Groq: 6,000 requests/day
- Gemini: 1,500 requests/day
- More than enough for podcasts!

✅ **Process one at a time**

- Don't batch 100 episodes at once
- Free tiers have rate limits
- Script respects these automatically

---

## Links

- **Groq Console:** https://console.groq.com/
- **Gemini API:** https://makersuite.google.com/app/apikey
- **AssemblyAI:** https://www.assemblyai.com/

---

## Summary

1. ✅ **All options are FREE** (or have free tiers)
2. ✅ **Cost protection built-in**
3. ✅ **No unexpected charges**
4. ✅ **Easy to use**

Choose what works for you! 🎉
