# Episode tagging, pills and search

Each episode has guest facts and tags stored in `src/data/episodeMeta.json`
(keyed by episode GUID). They power:

- **Pills** on the episode card and episode page: position, company, city,
  country (and topics on the page). The guest's **name is never shown as a
  pill**, but it is searchable.
- **Search box** on the home page: matches title, description, position,
  company, city, country, guest name and tag aliases (`Canada`, `カナダ` and
  `北米` all find Canadian episodes). Several words narrow the results.
- (Planned) hub/tag pages for SEO.

## How the data is made

`npm run tag-episodes` asks Groq (`openai/gpt-oss-120b`) to read each episode's
title, description (and highlights, if a transcript exists) and return:

```json
{
  "guests": [{ "name": "Naoya", "position": "SRE", "company": "Shopify" }],
  "roles": ["sre-infra"],
  "countries": ["canada"],
  "cities": ["vancouver"],
  "topics": ["visa", "english"]
}
```

- Facts are literal: anything the text does not state is `null`. A company is
  only kept if it is a proper name (not "a local financial institution").
- Tags must come from the fixed lists in
  `src/constants/episodeVocabulary.ts`. Anything else is dropped and printed as
  a warning (add it to the vocabulary if it is worth keeping).
- Every result is saved with `"reviewed": false`.

The weekly RSS workflow runs the same script, so new episodes are tagged
automatically. Existing entries are never overwritten unless you ask.

## Reviewing (do this once, and spot-check new episodes)

```bash
npm run tag-episodes -- --report     # readable list of all episodes + tags
```

Fix anything wrong directly in `src/data/episodeMeta.json` (positions,
companies and names are free text; tags are slugs from the vocabulary).
Then mark everything as checked:

```bash
npm run tag-episodes -- --approve            # all entries
npm run tag-episodes -- --approve --guid=<guid>   # one entry
```

Note: positions and companies are as of the recording and can go out of date.

## Other commands

| Command                                         | What it does                                   |
| ----------------------------------------------- | ---------------------------------------------- |
| `npm run tag-episodes -- --limit=5`             | Tag at most 5 untagged episodes                |
| `npm run tag-episodes -- --guid=<guid> --force` | Redo one episode (also works on reviewed ones) |
| `npm run tag-episodes -- --force`               | Redo all **unreviewed** episodes               |
| `npm run tag-episodes -- --model=<groq-model>`  | Use another Groq model                         |
| `npm run tag-episodes -- --delay=8000`          | Wait longer between requests                   |

Groq's free tier has per-minute and per-day token limits. The script waits and
retries on per-minute limits; on the daily limit it stops, keeps everything
saved so far, and you can run it again later to continue.

## Adding a tag

Add an entry to the right list in `src/constants/episodeVocabulary.ts`
(`slug`, Japanese `label`, `aliases`, optional `searchAliases`), then re-run
`npm run tag-episodes -- --force` for the episodes that should use it.
