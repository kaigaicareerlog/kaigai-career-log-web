/** One speaker label as identified by the model */
export interface SpeakerGuess {
  label: string;
  name: string | null;
  confidence: 'high' | 'low';
  /** Short quote or reason the model gave */
  evidence?: string;
}

export interface ResolvedSpeakers {
  /** label → name, only for labels that are safe to rename */
  map: Record<string, string>;
  /** Labels left as they are, with the reason, for the reviewer */
  unresolved: Array<{ label: string; reason: string }>;
  /** Labels named by elimination rather than by clear evidence */
  byElimination: string[];
}

const ROMAJI_NAME = /^[A-Za-z][A-Za-z .'-]*$/;

/**
 * Decide which model guesses to apply. A name is used only when the model is
 * confident, the name is written in romaji and it literally appears in the
 * transcript excerpt (people are introduced or addressed by name, so a name
 * that never appears is a guess, even for a host). Known names only fix the
 * spelling. Two labels claiming the same person are both left unresolved.
 *
 * When exactly one label is left and exactly one known person (host or tagged
 * guest) mentioned in the excerpt is still unmatched, that person is used by
 * elimination (typically the host who never introduces themselves).
 *
 * aliases lists other names a known person goes by (e.g. Ryo introduces
 * himself by his family name, Togashi). An alias counts as a mention, and a
 * guess of an alias is saved under the known name.
 */
export function resolveSpeakerMap({
  guesses,
  labels,
  knownNames,
  aliases = {},
  excerpt,
}: {
  guesses: SpeakerGuess[];
  labels: string[];
  knownNames: string[];
  aliases?: Record<string, string[]>;
  excerpt: string;
}): ResolvedSpeakers {
  const canonical = new Map(
    knownNames.flatMap((name) => [
      [name.toLowerCase(), name] as const,
      ...(aliases[name] ?? []).map(
        (alias) => [alias.toLowerCase(), name] as const
      ),
    ])
  );
  const lowerExcerpt = excerpt.toLowerCase();
  const isMentioned = (name: string) =>
    [name, ...(aliases[name] ?? [])].some((n) =>
      lowerExcerpt.includes(n.toLowerCase())
    );
  const unresolved: ResolvedSpeakers['unresolved'] = [];
  const candidates = new Map<string, string>();

  for (const label of labels) {
    const guess = guesses.find((g) => g.label === label);
    const name = guess?.name?.trim();

    if (!guess || !name) {
      unresolved.push({ label, reason: 'not identified' });
    } else if (guess.confidence !== 'high') {
      unresolved.push({ label, reason: `low confidence (${name}?)` });
    } else if (!ROMAJI_NAME.test(name)) {
      unresolved.push({ label, reason: `name not in romaji (${name})` });
    } else {
      const resolvedName = canonical.get(name.toLowerCase()) ?? name;
      if (isMentioned(resolvedName)) {
        candidates.set(label, resolvedName);
      } else {
        unresolved.push({ label, reason: `${name} is not mentioned` });
      }
    }
  }

  const map: Record<string, string> = {};
  for (const [label, name] of candidates) {
    const sameName = [...candidates].filter(([, other]) => other === name);
    if (sameName.length > 1) {
      unresolved.push({
        label,
        reason: `${name} matched more than one speaker`,
      });
    } else {
      map[label] = name;
    }
  }

  const byElimination: string[] = [];
  if (unresolved.length === 1) {
    const remaining = [...new Set(canonical.values())].filter(
      (name) => isMentioned(name) && !Object.values(map).includes(name)
    );
    if (remaining.length === 1) {
      map[unresolved[0].label] = remaining[0];
      byElimination.push(unresolved[0].label);
      unresolved.length = 0;
    }
  }

  return { map, unresolved, byElimination };
}
