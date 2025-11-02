# Speaker Update - Quick Start Guide

Quick reference for updating speaker labels in transcripts.

---

## ⚡ Quick Method (GitHub Actions)

1. **Go to Actions** → `Update Transcript Speakers`
2. **Fill in:**
   - Episode GUID: `cc15a703-73c7-406b-8abc-ad7d0a192d05`
   - Speaker A name: `Ryo` (or leave empty to skip)
   - Speaker B name: `Senna` (or leave empty to skip)
   - Speaker C name: `John Smith` (or leave empty to skip)
   - Speaker D name: `Ayaka` (or leave empty to skip)
3. **Run** → Changes committed automatically

Done! All speakers are updated at once! ✨

---

## 🎨 What Changes

### Before Update:

```
Speaker A: こんにちは
```

### After Update (e.g., A → Ryo):

```
[🖼️ Ryo's Avatar] Ryo (in blue)
                   こんにちは
```

---

## 🎭 Available Speakers

### Hosts (Special Display)

| Name  | Avatar | Color  | File        |
| ----- | ------ | ------ | ----------- |
| Ryo   | 👨     | Blue   | `ryo.JPG`   |
| Senna | 👩     | Pink   | `senna.jpg` |
| Ayaka | 👩     | Purple | `ayaka.jpg` |

### Guests (Default Display)

- Any name accepted (e.g., "John Smith", "Dr. Lee")
- Default person icon avatar
- Use quotes for multi-word names in local commands

---

## 💻 Local Command

```bash
npm run update-speakers <guid> <A-name> [B-name] [C-name] [D-name]

# Update all speakers at once
npm run update-speakers cc15a703... Ryo Senna "John Smith" Ayaka

# Update only some speakers
npm run update-speakers cc15a703... Ryo Senna  # Only A and B
npm run update-speakers cc15a703... "" Senna  # Only B

# Use quotes for multi-word names
npm run update-speakers cc15a703... Ryo "Jane Doe"
```

---

## 📖 Full Documentation

See [UPDATE_SPEAKERS.md](UPDATE_SPEAKERS.md) for:

- Detailed workflow
- Troubleshooting
- Visual examples
- Batch updates

---

## 🔗 Related

- [Transcription Guide](TRANSCRIPTION_GUIDE.md) - Create transcripts
- [Cleanup Options](CLEANUP_OPTIONS.md) - Improve text quality
- [GitHub Actions Setup](TRANSCRIPTION_GITHUB_SETUP.md) - Setup guide
