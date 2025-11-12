# RSS File Cleanup

## Overview

The `cleanup-old-rss-files.ts` script automatically removes outdated RSS files to keep the repository clean and manageable.

## What It Does

### RSS XML Files
- **Keeps**: Only the newest RSS XML file
- **Deletes**: All older RSS XML files
- The script parses timestamps from filenames (format: `YYYYMMDD-HHMM-rss-file.xml`)

### Episode JSON Files
- **Keeps**: Files from the last 3 days
- **Deletes**: Files older than 3 days
- The script parses timestamps from filenames (format: `YYYYMMDD-HHMM-episodes.json`)

## How It Works

The script parses dates directly from filenames instead of relying on file modification times. This makes it reliable in CI/CD environments like GitHub Actions where file modification times are reset during checkout.

The script uses the `parseTimestampFromFilename` utility function from `src/utils/formatters.ts` to parse timestamps, following the project's best practice of extracting reusable utilities.

### Filename Format
Files must follow the naming pattern: `YYYYMMDD-HHMM-{type}.{ext}`

Examples:
- `20251112-0815-rss-file.xml`
- `20251112-0815-episodes.json`

## Usage

### Manual Execution
```bash
npx tsx scripts/cleanup-old-rss-files.ts
```

### Automated Execution
The script runs automatically as part of the `update-rss` GitHub Action workflow.

## Output Example

```
Cleaning up old RSS files in: /path/to/public/rss

=== Cleaning up RSS XML files ===
Keeping newest RSS XML: 20251112-0815-rss-file.xml
Deleting 2 old RSS XML file(s):
  - 20251111-0816-rss-file.xml
  - 20251110-0814-rss-file.xml

=== Cleaning up episode JSON files ===
Keeping files from the last 3 days
Deleting 5 episode file(s) older than 2025-11-09T01:58:22.633Z:
  - 20251108-0815-episodes.json (2025-11-08T16:15:00.000Z)
  ...

Keeping 4 recent episode file(s):
  - 20251109-0814-episodes.json (2025-11-09T16:14:00.000Z)
  ...

✅ Cleanup completed successfully
```

## Configuration

To change the number of days to keep episode files, modify the `daysToKeep` variable in the script:

```typescript
// In cleanup-old-rss-files.ts
const daysToKeep = 3; // Change this value
cleanupEpisodeFiles(rssDir, daysToKeep);
```

## Why This Approach?

Previously, the cleanup used bash commands with `find -mtime +3`, which:
- **Problem 1**: Required files to be >3 days old (actually 4+ days)
- **Problem 2**: Didn't work reliably in GitHub Actions because file modification times reset on checkout

The new TypeScript approach:
- ✅ Parses dates directly from filenames
- ✅ Works reliably in CI/CD environments
- ✅ More maintainable and testable
- ✅ Better error handling and logging
- ✅ Consistent with other scripts in the project

