# Speaker Update - Quick Start Guide

Quick reference for updating speaker labels in transcripts.

---

## ⚡ Quick Method (GitHub Actions)

1. **Go to Actions** → `Update Transcript Speakers`
2. **Fill in:**
   - Episode GUID: `cc15a703-73c7-406b-8abc-ad7d0a192d05`
   - Old speaker: `A` or `B` or `C`
   - Speaker type: `Host` or `Guest`
   - **If Host:** Select `Ryo`, `Senna`, or `Ayaka`
   - **If Guest:** Enter name (e.g., "John Smith")
3. **Run** → Review PR → Merge

Done! The episode page will now show the speaker's avatar and name. ✨

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
- Default gray avatar (favicon)
- Use quotes for multi-word names in local commands

---

## 💻 Local Command

```bash
tsx scripts/update-transcript-speakers.ts <guid> <old> <new>

# Host examples
tsx scripts/update-transcript-speakers.ts cc15a703... A Ryo
tsx scripts/update-transcript-speakers.ts cc15a703... B Senna

# Guest examples (use quotes for multi-word names)
tsx scripts/update-transcript-speakers.ts cc15a703... C "John Smith"
tsx scripts/update-transcript-speakers.ts cc15a703... D Ayaka
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
