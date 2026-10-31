import fs from 'fs';
import type { TranscriptJSON } from '../../types';
import { getTranscriptJsonFilePath } from '../getTranscriptJsonFilePath';

/** The episode's transcript, or null if it has none (or can't be read) */
export function readTranscriptIfExists(guid: string): TranscriptJSON | null {
  try {
    const transcriptPath = getTranscriptJsonFilePath(guid);
    if (!fs.existsSync(transcriptPath)) return null;
    return JSON.parse(fs.readFileSync(transcriptPath, 'utf-8'));
  } catch (error) {
    console.error(`Failed to load transcript for ${guid}:`, error);
    return null;
  }
}

/** The transcript's highlights that are filled in */
export function getTranscriptHighlights(
  transcript: TranscriptJSON | null
): string[] {
  return [
    transcript?.highlight1,
    transcript?.highlight2,
    transcript?.highlight3,
  ].filter((highlight): highlight is string => Boolean(highlight));
}
