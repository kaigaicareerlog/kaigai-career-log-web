/**
 * Utility functions for audio transcription using ElevenLabs Scribe
 */
import type {
  TranscriptionResult,
  TranscriptUtterance,
  TranscriptWord,
} from '../../types';

interface ScribeWord {
  text: string;
  start?: number;
  end?: number;
  type: 'word' | 'spacing' | 'audio_event';
  speaker_id?: string;
  logprob?: number;
}

interface ScribeResponse {
  text: string;
  words: ScribeWord[];
}

/**
 * Group Scribe tokens into per-speaker utterances. Spacing tokens are kept
 * in the text so Japanese and mixed-language text reads naturally.
 */
export function groupWordsIntoUtterances(
  scribeWords: ScribeWord[]
): TranscriptUtterance[] {
  const utterances: TranscriptUtterance[] = [];

  for (const token of scribeWords) {
    if (token.type === 'audio_event') continue;

    const current = utterances[utterances.length - 1];
    const speaker = token.speaker_id ?? current?.speaker ?? 'speaker_0';

    if (token.type === 'spacing') {
      if (current) current.text += token.text;
      continue;
    }

    const start = Math.round((token.start ?? 0) * 1000);
    const end = Math.round((token.end ?? 0) * 1000);
    const word: TranscriptWord = {
      text: token.text,
      start,
      end,
      confidence: Math.exp(token.logprob ?? 0),
      speaker,
    };

    if (current && current.speaker === speaker) {
      current.text += token.text;
      current.end = end;
      current.words.push(word);
    } else {
      utterances.push({ speaker, text: token.text, start, end, words: [word] });
    }
  }

  return utterances.map((utterance) => ({
    ...utterance,
    text: utterance.text.trim(),
  }));
}

export interface ScribeOptions {
  /** Exact number of speakers; improves diarization when known */
  numSpeakers?: number;
  /** Proper nouns to bias recognition towards (adds a 20% surcharge) */
  keyterms?: string[];
  /** Keep filler words and false starts (default: drop them) */
  verbatim?: boolean;
}

/**
 * Transcribe audio using ElevenLabs Scribe (speech-to-text only)
 * @param audioUrl - Public URL of the audio file to transcribe
 * @param apiKey - ElevenLabs API key
 * @returns Transcription result with speaker diarization
 */
export async function transcribeAudioWithElevenLabs(
  audioUrl: string,
  apiKey: string,
  { numSpeakers, keyterms = [], verbatim = false }: ScribeOptions = {}
): Promise<TranscriptionResult> {
  const form = new FormData();
  form.append('model_id', 'scribe_v2');
  form.append('cloud_storage_url', audioUrl);
  form.append('language_code', 'jpn');
  form.append('diarize', 'true');
  form.append('timestamps_granularity', 'word');
  form.append('tag_audio_events', 'false');
  // Drop filler words (えー, あの, ...) and false starts
  if (!verbatim) form.append('no_verbatim', 'true');
  if (numSpeakers) form.append('num_speakers', String(numSpeakers));
  for (const term of keyterms) form.append('keyterms', term);

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `ElevenLabs transcription failed: ${response.status} ${detail.slice(0, 300)}`
    );
  }

  const result = (await response.json()) as ScribeResponse;
  const utterances = groupWordsIntoUtterances(result.words);
  const words = utterances.flatMap((utterance) => utterance.words);

  return {
    text: result.text,
    utterances,
    words,
    audio_duration: words.length > 0 ? words[words.length - 1].end : 0,
  };
}
