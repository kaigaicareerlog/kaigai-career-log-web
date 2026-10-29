/**
 * Replace diarization labels (speaker_0, speaker_1, ...) in a transcript with
 * people's names, using Groq to read the self-introductions. Only confident
 * matches are applied; the rest stay as labels for a human to fix with
 * update-transcript-speakers.
 *
 * Usage: tsx scripts/name-speakers.ts <episode-guid> [--dry-run] [--report=<file>]
 *   --report   also write a Markdown summary (used as the PR description)
 */

import fs from 'fs';
import { HOST_ALIASES, HOSTS } from '../src/constants/actors';
import { getEpisodeMeta } from '../src/utils/episodeMeta/episodeMetaFile';
import { getTranscriptByGuid } from '../src/utils/getTranscriptByGuid';
import { getTranscriptJsonFilePath } from '../src/utils/getTranscriptJsonFilePath';
import { identifySpeakers } from '../src/utils/groq/identifySpeakers';
import { buildSpeakerExcerpt } from '../src/utils/transcript/buildSpeakerExcerpt';
import { checkGuestTalksMost } from '../src/utils/transcript/checkGuestTalksMost';
import {
  resolveSpeakerMap,
  type ResolvedSpeakers,
  type SpeakerGuess,
} from '../src/utils/transcript/resolveSpeakerMap';
import type { TranscriptJSON } from '../src/types';

const DIARIZATION_LABEL = /^speaker_\d+$/;

function getOption(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv
    .find((arg) => arg.startsWith(prefix))
    ?.slice(prefix.length);
}

function buildReport(
  transcript: TranscriptJSON,
  labels: string[],
  guesses: SpeakerGuess[],
  resolved: ResolvedSpeakers,
  warning: string | null
): string {
  const counts = new Map<string, number>();
  for (const u of transcript.utterances) {
    counts.set(u.speaker, (counts.get(u.speaker) ?? 0) + 1);
  }

  const rows = labels.map((label) => {
    const name = resolved.map[label];
    const reason = resolved.unresolved.find((u) => u.label === label)?.reason;
    const evidence = guesses.find((g) => g.label === label)?.evidence ?? '';
    const utterances = counts.get(name ?? label) ?? 0;
    const nameCell = !name
      ? `⚠️ ${reason}`
      : resolved.byElimination.includes(label)
        ? `**${name}**（消去法・要確認）`
        : `**${name}**`;
    return `| ${label} | ${nameCell} | ${utterances} | ${evidence} |`;
  });

  return [
    `## 話者名: ${transcript.episodeTitle}`,
    '',
    '| ラベル | 名前 | 発話数 | 根拠 |',
    '|---|---|---|---|',
    ...rows,
    '',
    resolved.unresolved.length
      ? '⚠️ のラベルはそのまま残しています。Update Transcript Speakers ワークフローで名前を付けてください。'
      : 'すべての話者に名前を付けました。',
    ...(warning ? ['', `⚠️ ${warning}`] : []),
    '',
    '話者分離は回の後半でずれることがあります。後半の発言者が違っていたら Update Transcript Speakers ワークフローで直してください。',
  ].join('\n');
}

async function nameSpeakers(guid: string): Promise<void> {
  const transcript = getTranscriptByGuid(guid);
  const labels = [
    ...new Set(
      transcript.utterances
        .map((u) => u.speaker)
        .filter((speaker) => DIARIZATION_LABEL.test(speaker))
    ),
  ];

  if (labels.length === 0) {
    console.log('⏭️  No speaker_N labels left to name');
    return;
  }

  const hostNames = HOSTS.map((host) => host.name);
  const guestNames = (getEpisodeMeta(guid)?.guests ?? [])
    .map((guest) => guest.name)
    .filter((name): name is string => Boolean(name));
  const excerpt = buildSpeakerExcerpt(transcript.utterances);

  console.log(`\n🗣️  Naming speakers for: ${transcript.episodeTitle}`);
  console.log(`   Labels: ${labels.join(', ')}`);

  const guesses = await identifySpeakers({
    episodeTitle: transcript.episodeTitle,
    hostNames,
    hostAliases: HOST_ALIASES,
    guestNames,
    labels,
    excerpt,
  });
  const resolved = resolveSpeakerMap({
    guesses,
    labels,
    knownNames: [...hostNames, ...guestNames],
    aliases: HOST_ALIASES,
    excerpt,
  });

  for (const [label, name] of Object.entries(resolved.map)) {
    const note = resolved.byElimination.includes(label)
      ? ' (by elimination)'
      : '';
    console.log(`   ✅ ${label} → ${name}${note}`);
  }
  for (const { label, reason } of resolved.unresolved) {
    console.log(`   ⚠️  ${label} kept (${reason})`);
  }

  const renamed = transcript.utterances.map((u) => ({
    ...u,
    speaker: resolved.map[u.speaker] ?? u.speaker,
  }));
  const warning = checkGuestTalksMost(renamed, guestNames);
  if (warning) console.log(`   ⚠️  ${warning}`);

  const reportPath = getOption('report');
  const applyRenames = !process.argv.includes('--dry-run');
  if (applyRenames && Object.keys(resolved.map).length > 0) {
    transcript.utterances = renamed;
    transcript.speakerMap = { ...transcript.speakerMap, ...resolved.map };
    fs.writeFileSync(
      getTranscriptJsonFilePath(guid),
      JSON.stringify(transcript, null, 2),
      'utf-8'
    );
    console.log('💾 Saved transcript');
  }

  if (reportPath) {
    fs.writeFileSync(
      reportPath,
      buildReport(transcript, labels, guesses, resolved, warning),
      'utf-8'
    );
  }
}

const guid = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
if (!guid) {
  console.error(
    'Usage: tsx scripts/name-speakers.ts <episode-guid> [--dry-run] [--report=<file>]'
  );
  process.exit(1);
}

nameSpeakers(guid)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', (error as Error).message);
    process.exit(1);
  });
