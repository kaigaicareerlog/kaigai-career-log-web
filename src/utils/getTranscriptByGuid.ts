import fs from 'fs';
import type { TranscriptJSON } from '../types';
import { getTranscriptJsonFilePath } from './getTranscriptJsonFilePath';

export function getTranscriptByGuid(guid: string): TranscriptJSON {
  // Load existing transcript
  const jsonPath = getTranscriptJsonFilePath(guid);

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Transcript not found: ${jsonPath}`);
  }

  const transcript = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  return transcript;
}
