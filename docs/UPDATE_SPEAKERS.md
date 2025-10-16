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
   - **Old speaker label**: Enter the current label (e.g., `A`, `B`, `C`)
   - **Speaker type**: Select `Host` or `Guest`
   - **If Host**: Select from dropdown (Ryo, Senna, or Ayaka)
   - **If Guest**: Enter the guest's name (e.g., "John Smith")
5. Click **"Run workflow"**

### Step 3: Review and Merge

1. Wait for the workflow to complete (~30 seconds)
2. A pull request will be created automatically
3. Review the changes
4. Merge the PR
5. The episode page will now show the correct speaker!

### Example Workflow

```
Scenario: Episode has 4 speakers (A, B, C, D) - Ryo, Senna, a guest, and Ayaka

Step 1: Update Speaker A → Ryo
  - Old speaker: A
  - Speaker type: Host
  - New speaker: Ryo
  - Run workflow → Merge PR

Step 2: Update Speaker B → Senna
  - Old speaker: B
  - Speaker type: Host
  - New speaker: Senna
  - Run workflow → Merge PR

Step 3: Update Speaker C → Guest
  - Old speaker: C
  - Speaker type: Guest
  - New speaker: John Smith
  - Run workflow → Merge PR

Step 4: Update Speaker D → Ayaka
  - Old speaker: D
  - Speaker type: Host
  - New speaker: Ayaka
  - Run workflow → Merge PR

Done! All speakers are now labeled correctly, including the guest!
```

---

## Local Usage

If you prefer to update speakers locally:

### Command

```bash
tsx scripts/update-transcript-speakers.ts <guid> <old-speaker> <new-speaker>
```

### Examples

```bash
# Update speaker A to Ryo (Host)
tsx scripts/update-transcript-speakers.ts cc15a703-73c7-406b-8abc-ad7d0a192d05 A Ryo

# Update speaker B to Senna (Host)
tsx scripts/update-transcript-speakers.ts cc15a703-73c7-406b-8abc-ad7d0a192d05 B Senna

# Update speaker C to a guest (use quotes for multi-word names)
tsx scripts/update-transcript-speakers.ts cc15a703-73c7-406b-8abc-ad7d0a192d05 C "John Smith"

# Update speaker D to Ayaka (Host)
tsx scripts/update-transcript-speakers.ts cc15a703-73c7-406b-8abc-ad7d0a192d05 D Ayaka
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

Update all speakers in one go:

```bash
# Update all speakers for an episode (hosts and guests)
tsx scripts/update-transcript-speakers.ts {guid} A Ryo
tsx scripts/update-transcript-speakers.ts {guid} B "Jane Doe"
tsx scripts/update-transcript-speakers.ts {guid} C Senna
tsx scripts/update-transcript-speakers.ts {guid} D "Dr. Smith"
```

Or use GitHub Actions to update them one at a time (creates separate PRs).

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
# Oops, Speaker A was actually Senna, not Ryo
tsx scripts/update-transcript-speakers.ts {guid} Ryo Senna
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

| Task                         | Command                                                        |
| ---------------------------- | -------------------------------------------------------------- |
| Update via GitHub Actions    | Actions → Update Transcript Speakers → Fill form → Run         |
| Update locally               | `tsx scripts/update-transcript-speakers.ts <guid> <old> <new>` |
| Check current speakers       | `cat public/transcripts/{guid}.json \| grep speaker`           |
| Host names (special display) | Ryo, Senna, Ayaka (get custom avatars/colors)                  |
| Guest names                  | Any name (e.g., "John Smith" - gets default appearance)        |

---

**Happy podcasting! 🎙️**
