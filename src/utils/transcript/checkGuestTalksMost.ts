/**
 * In an interview the guest does most of the talking. If a tagged guest has
 * less text than another speaker, diarization has probably merged people, so
 * the speaker names need a closer look. Returns a warning, or null.
 */
export function checkGuestTalksMost(
  utterances: Array<{ speaker: string; text: string }>,
  guestNames: string[]
): string | null {
  const chars = new Map<string, number>();
  for (const { speaker, text } of utterances) {
    chars.set(speaker, (chars.get(speaker) ?? 0) + text.length);
  }
  const [topSpeaker] = [...chars].sort((a, b) => b[1] - a[1])[0] ?? [];
  const presentGuests = guestNames.filter((name) => chars.has(name));

  if (presentGuests.length === 0 || presentGuests.includes(topSpeaker)) {
    return null;
  }
  return `ゲスト（${presentGuests.join(', ')}）より ${topSpeaker} の発話量が多く、話者分離が混ざっている可能性があります`;
}
