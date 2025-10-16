# GitHub Actions Transcription Setup

This guide shows how to set up automatic transcription using GitHub Actions.

## Quick Setup (2 minutes)

### 1. Get API Key

- **AssemblyAI** (transcription): https://www.assemblyai.com/
  - Create an account
  - Get your API key from the dashboard

### 2. Add Secret to GitHub

1. Go to your repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add this secret:

| Secret Name          | Value               | Required |
| -------------------- | ------------------- | -------- |
| `ASSEMBLYAI_API_KEY` | Your AssemblyAI key | ✅ Yes   |

### 3. Run the Workflow

1. Go to Actions tab in your repository
2. Select "Transcribe Episode" workflow
3. Click "Run workflow"
4. Enter:
   - **Episode GUID**: The episode ID
5. Click "Run workflow"

## What Happens

The workflow will automatically:

1. ✅ Transcribe the audio (AssemblyAI)
2. ✅ Clean up extra spaces in the text
3. ✅ Create a pull request with the transcript

After running, you'll get a PR with:

- Speaker-labeled transcript
- Timestamps for each utterance
- Cleaned text (extra spaces removed)

## Troubleshooting

### "ASSEMBLYAI_API_KEY not set"

Make sure you added the secret in GitHub repository settings.

### Workflow fails

1. Check the workflow logs in Actions tab
2. Verify the API key is valid
3. Make sure the episode GUID is correct

## Next Steps

After the PR is merged:

1. The transcript automatically appears on the episode page
2. Visitors can read the full conversation
3. Update speaker labels using the "Update Transcript Speakers" workflow

---

**Related Guides:**

- [Update Speakers](UPDATE_SPEAKERS.md) - Label speakers with real names
- [Speaker Quick Start](SPEAKER_UPDATE_QUICKSTART.md) - Quick reference

---

**Happy transcribing! 🎙️**
