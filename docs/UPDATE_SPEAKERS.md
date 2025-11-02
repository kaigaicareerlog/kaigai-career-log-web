# Update Transcript Speakers

Guide to update speaker labels in transcripts (e.g., from "A", "B", "C" to real names like "Ryo", "Senna", "Ayaka").

---

## Why Update Speakers?

After transcription, speakers are labeled as "A", "B", "C", etc. You should update these to real names so:

- ✅ Visitors see who's speaking
- ✅ Host avatars and colors display correctly
- ✅ Transcripts are more readable and personal

---

## Available Speakers

### Hosts

| Name      | Avatar | Color  |
| --------- | ------ | ------ |
| **Ryo**   | 👨     | Blue   |
| **Senna** | 👩     | Pink   |
| **Ayaka** | 👩     | Purple |

### Guests

Guest speakers can have any name. They will be displayed with a default gray avatar and color.

---

## Using GitHub Actions (Recommended)

### Step 1: Identify Speakers

1. Go to your episode page (e.g., `/episodes/{guid}`)
2. Check the transcript section
3. Note which letter corresponds to which person:
   - Speaker A = Ryo
   - Speaker B = Senna
   - etc.

### Step 2: Run the Workflow

1. Go to your repository → **Actions**
2. Select **"Update Transcript Speakers"**
3. Click **"Run workflow"**
4. Fill in the form:
   - **Episode GUID**: The episode ID
   - **Speaker A name**: Name for speaker A (e.g., `Ryo`)
   - **Speaker B name**: Name for speaker B (e.g., `Senna`)
   - **Speaker C name**: Name for speaker C (e.g., `John Smith`) - Optional
   - **Speaker D name**: Name for speaker D (e.g., `Ayaka`) - Optional
5. Click **"Run workflow"**

### Step 3: Check Results

1. Wait for the workflow to complete (~30 seconds)
2. Changes are committed directly to main branch
3. The episode page will now show all correct speakers!

### Example Workflow

```
Scenario: Episode has 4 speakers (A, B, C, D) - Ryo, Senna, a guest, and Ayaka

Single workflow run - Update all speakers at once:
  - Episode GUID: cc15a703-73c7-406b-8abc-ad7d0a192d05
  - Speaker A name: Ryo
  - Speaker B name: Senna
  - Speaker C name: John Smith
  - Speaker D name: Ayaka
  - Run workflow

Done! All speakers are now labeled correctly in one go! ✨

---

If you only want to update some speakers:
  - Episode GUID: cc15a703-73c7-406b-8abc-ad7d0a192d05
  - Speaker A name: Ryo
  - Speaker B name: Senna
  - Speaker C name: (leave empty)
  - Speaker D name: (leave empty)
  - Run workflow

Result: Only A and B are updated, C and D remain unchanged.
```

---

## Local Usage

If you prefer to update speakers locally:

### Command

```bash
npm run update-speakers <guid> <speaker-A-name> [speaker-B-name] [speaker-C-name] [speaker-D-name]
```

### Examples

```bash
# Update all speakers at once (A=Ryo, B=Senna, C=John Smith, D=Ayaka)
npm run update-speakers cc15a703-73c7-406b-8abc-ad7d0a192d05 Ryo Senna "John Smith" Ayaka

# Update only A and B (use quotes for multi-word names)
npm run update-speakers cc15a703-73c7-406b-8abc-ad7d0a192d05 Ryo Senna

# Update only specific speakers (use "" to skip)
npm run update-speakers cc15a703-73c7-406b-8abc-ad7d0a192d05 "" Senna  # Only update B
npm run update-speakers cc15a703-73c7-406b-8abc-ad7d0a192d05 Ryo "" "John Smith"  # Update A and C only
```

### Commit and Push

After running the script locally:

```bash
git add public/transcripts/
git commit -m "Update speakers for episode {guid}"
git push
```

---

## How It Works

### 1. **Script Updates JSON**

The script reads the transcript JSON file and updates the `speaker` field in all utterances:

```json
// Before
{
  "speaker": "A",
  "text": "こんにちは",
  "timestamp": "00:00:05"
}

// After
{
  "speaker": "Ryo",
  "text": "こんにちは",
  "timestamp": "00:00:05"
}
```

### 2. **Episode Page Displays Host Info**

The episode page uses the `getHostInfo()` utility to fetch:

- Host name
- Avatar image
- Brand color

### 3. **Visual Display**

Each utterance shows:

- 🖼️ **Avatar**: Host's profile picture with colored border
- 👤 **Name**: Host's name in their brand color
- ⏱️ **Timestamp**: When they spoke
- 💬 **Text**: What they said

---

## Validation

The script validates that:

- ✅ The new speaker name is not empty
- ✅ The transcript file exists
- ✅ At least one utterance is updated

If validation fails, you'll see an error message.

**Note:** Any speaker name is accepted - hosts (Ryo, Senna, Ayaka) get special avatars and colors, while guests get a default appearance.

---

## Tips

### Batch Updates

Update all speakers in one single command:

```bash
# Update all speakers for an episode (hosts and guests)
npm run update-speakers {guid} Ryo "Jane Doe" Senna "Dr. Smith"
```

This is much faster than the old method which required 4 separate commands!

### Guest Names

For guest speakers:

- Use quotes for multi-word names: `"John Smith"`
- Single word names don't need quotes: `John`
- Guests will display with a default avatar (favicon) and gray color
- You can always update the `hosts.ts` file to add custom avatars for frequent guests

### Checking Current Speakers

To see current speaker labels, check the transcript JSON:

```bash
# View speakers in transcript
cat public/transcripts/{guid}.json | grep -o '"speaker":"[^"]*"' | sort -u
```

### Reverting Changes

If you made a mistake, just run the script again with the correct mapping:

```bash
# Oops, Speakers were in wrong order - swap A and B
npm run update-speakers {guid} Senna Ryo
```

---

## Troubleshooting

### "Transcript not found"

- Check the GUID is correct
- Make sure the transcript JSON exists in `public/transcripts/`
- Run transcription first if needed

### "No utterances found"

The old speaker label doesn't exist in the transcript. Check:

- The transcript file to see actual speaker labels
- You're using the correct old speaker label

### Workflow fails

- Make sure you have `PAT_TOKEN` or `GITHUB_TOKEN` in secrets
- Check the workflow logs for detailed error messages

---

## Visual Preview

After updating speakers, your transcript will look like this:

```
┌─────────────────────────────────────────┐
│ 🟦 Ryo                      00:00:05    │
│ こんにちは、今日のゲストは...          │
│                                         │
│ 🟪 Ayaka                    00:00:15    │
│ はじめまして、よろしくお願いします      │
│                                         │
│ 🟨 Senna                    00:00:25    │
│ 今日はどんな話をしましょうか            │
└─────────────────────────────────────────┘
```

Each speaker has:

- Their color-coded name
- Profile picture
- Timestamp
- Clear, natural Japanese text (if you used AI cleanup!)

---

## Next Steps

After updating speakers:

1. ✅ **Deploy**: Changes go live automatically after merging PR
2. ✅ **Verify**: Check the episode page to see the correct names/avatars
3. ✅ **Repeat**: Update speakers for other episodes as needed

---

## Related Documentation

- [Transcription Guide](TRANSCRIPTION_GUIDE.md) - How to create transcripts
- [Cleanup Options](CLEANUP_OPTIONS.md) - Improve transcript text quality
- [GitHub Actions Setup](TRANSCRIPTION_GITHUB_SETUP.md) - Setup guide

---

## Quick Reference

| Task                         | Command                                                       |
| ---------------------------- | ------------------------------------------------------------- |
| Update via GitHub Actions    | Actions → Update Transcript Speakers → Fill all names → Run   |
| Update locally               | `npm run update-speakers <guid> <A-name> [B] [C] [D]`        |
| Check current speakers       | `cat public/transcripts/{guid}.json \| grep speaker`          |
| Host names (special display) | Ryo, Senna, Ayaka (get custom avatars/colors)                 |
| Guest names                  | Any name (e.g., "John Smith" - gets default appearance)       |

---

**Happy podcasting! 🎙️**
