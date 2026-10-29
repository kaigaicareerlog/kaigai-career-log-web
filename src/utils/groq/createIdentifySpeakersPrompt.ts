export interface IdentifySpeakersPromptInput {
  episodeTitle: string;
  /** Host names in romaji */
  hostNames: string[];
  /** Other names a host goes by, keyed by host name */
  hostAliases?: Record<string, string[]>;
  /** Guest names from the episode's tags, in romaji */
  guestNames: string[];
  labels: string[];
  excerpt: string;
}

/**
 * Builds the prompt that matches diarization labels (speaker_0, ...) to
 * people. The model must say "low" when unsure, since a wrong name is worse
 * than leaving the label for a human to fix.
 */
export function createIdentifySpeakersPrompt(
  input: IdentifySpeakersPromptInput
): string {
  const hosts = input.hostNames.map((name) => {
    const aliases = input.hostAliases?.[name] ?? [];
    return aliases.length
      ? `${name} (also called ${aliases.join(', ')})`
      : name;
  });

  return `You identify who is speaking in a Japanese podcast transcript. Speech-to-text has split the audio into speakers labelled ${input.labels.join(', ')}; your job is to say which person each label is.

Podcast hosts: ${hosts.join(', ')}
Guests tagged for this episode: ${input.guestNames.length ? input.guestNames.join(', ') : '(none)'}
Episode title: ${input.episodeTitle}

Rules:
- Use self-introductions ("〜です", "ホストの〜"), how others address a speaker ("〜さん"), and the role each label plays (the host who opens and runs the show, the guest who answers about their own career).
- A host can be the guest of an episode about their own career. Someone not listed (e.g. a guest host) may appear: use the name they introduce themselves with.
- Write every name in romaji, like the lists above (e.g. "Senna", not "セナ"), without さん. For a host, use the host name, not the "also called" name (e.g. "Ryo", not "Togashi").
- "confidence": "high" only when the excerpt clearly shows who it is; otherwise "low". Never guess a name with "high".
- Speech-to-text sometimes merges two people into one line, e.g. "本日のホストはFROGのSennaと…Junpeiさん… Junpeiです". Decide by what MOST of a label's lines are: the host who opens the show and introduces the others is the one saying "本日のホストは…", not the person whose "〜です" got merged at the end. When a label clearly mixes people, use "low".
- Each person can be only one label. If you cannot tell, use name null.
- "evidence": a few words quoted from the excerpt.

Transcript excerpt:
${input.excerpt}

Return only JSON:
{"speakers": [{"label": "speaker_0", "name": "Senna", "confidence": "high", "evidence": "FROGのSenna"}]}`;
}
