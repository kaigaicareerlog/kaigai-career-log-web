import type { TranscriptionResult, TranscriptJSON } from '../../types';
import { formatTimestamp } from '../formatters';
import {
  applyCorrections,
  type GlossaryCorrection,
} from '../glossary/glossary';

/**
 * Convert a Scribe result into the stored transcript format, fixing known
 * mistranscriptions along the way. Speakers keep Scribe's labels
 * (speaker_0, speaker_1, ...) until names are assigned.
 */
export function toTranscriptJSON({
  result,
  episodeGuid,
  episodeTitle,
  durationSeconds,
  corrections,
  transcribedAt = new Date(),
}: {
  result: TranscriptionResult;
  episodeGuid: string;
  episodeTitle: string;
  durationSeconds: number;
  corrections: GlossaryCorrection[];
  transcribedAt?: Date;
}): TranscriptJSON {
  return {
    episodeGuid,
    episodeTitle,
    transcribedAt: transcribedAt.toISOString(),
    transcriber: 'elevenlabs-scribe-v2',
    duration: durationSeconds,
    fullText: applyCorrections(result.text.trim(), corrections),
    utterances: result.utterances
      .filter((utterance) => utterance.text.trim())
      .map((utterance) => ({
        speaker: utterance.speaker,
        text: applyCorrections(utterance.text.trim(), corrections),
        start: utterance.start,
        end: utterance.end,
        timestamp: formatTimestamp(utterance.start),
      })),
  };
}
