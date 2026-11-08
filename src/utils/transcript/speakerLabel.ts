import { getHostInfo } from '../../constants/actors';

/**
 * Diarization labels that were never resolved to a person's name.
 * A single letter is the older AssemblyAI style; `speaker_N` is the
 * fallback left by automatic naming. These are not assigned to a host.
 */
const UNRESOLVED_LETTER = /^[A-D]$/;
const UNRESOLVED_SPEAKER_N = /^speaker_(\d+)$/i;

/**
 * @returns The neutral label to show, or null when `speaker` is a real name.
 */
export function unresolvedSpeakerDisplayName(speaker: string): string | null {
  if (UNRESOLVED_LETTER.test(speaker)) return `話者${speaker}`;

  const numbered = UNRESOLVED_SPEAKER_N.exec(speaker);
  if (numbered) return `話者${numbered[1]}`;

  return null;
}

/** True when the transcript still has a placeholder speaker label. */
export function isUnresolvedSpeakerLabel(speaker: string): boolean {
  return unresolvedSpeakerDisplayName(speaker) !== null;
}

/**
 * Name shown next to a transcript line. Placeholder labels stay anonymous
 * (`話者A`, `話者3`) instead of being guessed as a host or guest.
 */
export function getSpeakerDisplayName(speaker: string): string {
  return unresolvedSpeakerDisplayName(speaker) ?? getHostInfo(speaker).name;
}
