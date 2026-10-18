interface Utterance {
  speaker: string;
  text: string;
  start: number;
}

const INTRO_MS = 5 * 60 * 1000;
const MAX_INTRO_CHARS = 3000;
const SAMPLES_PER_SPEAKER = 2;
const MAX_SAMPLE_CHARS = 120;

const line = (u: Utterance, maxChars = Infinity) =>
  `[${u.speaker}] ${u.text.length > maxChars ? `${u.text.slice(0, maxChars)}...` : u.text}`;

/**
 * The part of a transcript that tells who is who: the opening minutes (hosts
 * and guests introduce themselves there), plus a couple of later lines from
 * every speaker so one who barely talks at the start still gets a sample.
 * Kept short to fit the Groq free tier's per-minute token limit.
 */
export function buildSpeakerExcerpt(utterances: Utterance[]): string {
  const intro: string[] = [];
  let introChars = 0;
  for (const u of utterances) {
    if (u.start > INTRO_MS) break;
    const text = line(u);
    if (introChars + text.length > MAX_INTRO_CHARS) break;
    intro.push(text);
    introChars += text.length;
  }

  const later = utterances.slice(intro.length);
  const samples = [...new Set(utterances.map((u) => u.speaker))].flatMap(
    (speaker) =>
      later
        .filter((u) => u.speaker === speaker && u.text.length >= 20)
        .slice(0, SAMPLES_PER_SPEAKER)
        .map((u) => line(u, MAX_SAMPLE_CHARS))
  );

  return [
    'Opening:',
    ...intro,
    ...(samples.length ? ['', 'Later lines:', ...samples] : []),
  ].join('\n');
}
