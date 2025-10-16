# GitHub Actions Transcription Setup

This guide shows how to set up automatic transcription with AI cleanup using GitHub Actions.

## Quick Setup (5 minutes)

### 1. Get API Keys

**Need detailed instructions?** 📖 See [API Keys Setup Guide](GET_API_KEYS.md)

#### Quick Links:

- **AssemblyAI** (transcription): https://www.assemblyai.com/
- **Groq** (cleanup, recommended): https://console.groq.com/
  - FREE tier: 6,000 requests/day
- **Google Gemini** (cleanup, alternative): https://aistudio.google.com/app/apikey
  - FREE tier: 1,500 requests/day

### 2. Add Secrets to GitHub

1. Go to your repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add these secrets:

| Secret Name          | Value               | Required           |
| -------------------- | ------------------- | ------------------ |
| `ASSEMBLYAI_API_KEY` | Your AssemblyAI key | ✅ Yes             |
| `GROQ_API_KEY`       | Your Groq key       | ✅ Yes (or Gemini) |
| `GEMINI_API_KEY`     | Your Gemini key     | Optional           |

**Note:** You only need ONE of either `GROQ_API_KEY` or `GEMINI_API_KEY`

### 3. Run the Workflow

1. Go to Actions tab in your repository
2. Select "Transcribe Episode" workflow
3. Click "Run workflow"
4. Enter:
   - **Episode GUID**: The episode ID
   - **Cleanup method**: Choose `groq` or `gemini`
5. Click "Run workflow"

## What Happens

The workflow will automatically:

1. ✅ Transcribe the audio (AssemblyAI)
2. ✅ Clean up the text with AI (Groq/Gemini)
   - Remove spaces between characters
   - Add proper punctuation
   - Make text natural and readable
3. ✅ Save JSON transcript to `public/transcripts/`
4. ✅ Create a Pull Request with the changes

## Example PR

After running, you'll get a PR with:

- Speaker-labeled transcript
- Timestamps for each utterance
- AI-cleaned natural Japanese text
- Ready to merge!

## Cost

- **AssemblyAI**: ~$0.50-1.00 per hour of audio
- **Groq**: FREE (up to 6,000 requests/day)
- **Gemini**: FREE (up to 1,500 requests/day)

**Total cost per episode**: ~$0.50-1.00 (just for transcription)

## Troubleshooting

### "ASSEMBLYAI_API_KEY not set"

Make sure you added the secret in GitHub repository settings.

### "GROQ_API_KEY not set"

1. Check you selected the right cleanup method
2. Make sure the secret name is exactly `GROQ_API_KEY`
3. Try using `gemini` instead if you have `GEMINI_API_KEY`

### Workflow fails

1. Check the workflow logs in Actions tab
2. Verify all API keys are valid
3. Make sure the episode GUID exists

## Advanced: Local Usage

If you prefer to run locally:

```bash
# Setup
export ASSEMBLYAI_API_KEY="your-key"
export GROQ_API_KEY="your-groq-key"

# Run
tsx scripts/transcribe-episode.ts <episode-guid>
tsx scripts/cleanup-transcript.ts <episode-guid> groq
```

## Files Generated

After the workflow completes, you'll have:

```
public/transcripts/
  └── <episode-guid>.json    # Cleaned transcript with AI
```

**Note:** We no longer generate `.md` files - only JSON!

## Next Steps

After the PR is merged:

1. The transcript automatically appears on the episode page
2. Visitors can read the full conversation
3. Search engines can index the content

Done! 🎉
