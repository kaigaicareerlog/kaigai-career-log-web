import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getTranscriptJsonFilePath(guid: string): string {
  const transcriptsDir = path.join(__dirname, '../..', 'public', 'transcripts');
  const jsonPath = path.join(transcriptsDir, `${guid}.json`);

  return jsonPath;
}
