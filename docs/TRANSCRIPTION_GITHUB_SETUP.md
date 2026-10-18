# GitHub Actions Transcription Setup

This guide shows how to set up automatic transcription using GitHub Actions.

## Quick Setup (2 minutes)

### 1. Get API Key

- **ElevenLabs** (transcription): https://elevenlabs.io/
  - Create an API key with only the Speech to Text permission
  - Set a credit limit on the key (see [TRANSCRIPTION_GUIDE.md](TRANSCRIPTION_GUIDE.md))

### 2. Add Secret to GitHub

1. Go to your repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add this secret:

| Secret Name          | Value               | Required |
| -------------------- | ------------------- | -------- |
| `ELEVENLABS_API_KEY` | Your ElevenLabs key | ✅ Yes   |

Optionally add the repository **variable** `MONTHLY_TRANSCRIPTION_BUDGET_USD` (default `5`).

### 3. Run the Workflow

1. Go to Actions tab in your repository
2. Select "Transcribe Episode" workflow
3. Click "Run workflow"
4. Enter:
   - **Episode GUID**: The episode ID
5. Click "Run workflow"

## What Happens

The workflow will automatically:

1. ✅ Check the monthly budget, then transcribe the audio (ElevenLabs Scribe)
2. ✅ Apply the proper-noun glossary
3. ✅ Generate highlights and commit the transcript

The transcript has:

- Speaker labels (`speaker_0`, `speaker_1`, ...)
- Timestamps for each utterance
- Punctuated text

## Troubleshooting

### "ELEVENLABS_API_KEY environment variable is required"

Make sure you added the secret in GitHub repository settings.

### Workflow fails

1. Check the workflow logs in Actions tab
2. Verify the API key is valid
3. Make sure the episode GUID is correct

## Next Steps

After the transcript is committed:

1. The transcript automatically appears on the episode page
2. Visitors can read the full conversation
3. Update speaker labels using the "Update Transcript Speakers" workflow

---

**Related Guides:**

- [Update Speakers](UPDATE_SPEAKERS.md) - Label speakers with real names
- [Speaker Quick Start](SPEAKER_UPDATE_QUICKSTART.md) - Quick reference

---

**Happy transcribing! 🎙️**
