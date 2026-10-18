import fs from 'fs';
import path from 'path';
import type { EpisodeMeta } from '../../types';

export interface GlossaryCorrection {
  /** Text the transcriber gets wrong */
  from: string;
  /** What it should read */
  to: string;
}

/**
 * Proper nouns for transcription, kept in src/data/glossary.json.
 * People's names are written in romaji (hosts: Ryo, Senna, Hiroshi).
 * The repository is public, so only add names that are already public in
 * episode titles, descriptions or transcripts.
 */
export interface Glossary {
  /** Sent to ElevenLabs Scribe as keyterms */
  keyterms: string[];
  /** Applied to the transcript text after transcription */
  corrections: GlossaryCorrection[];
}

const GLOSSARY_PATH = path.join(process.cwd(), 'src', 'data', 'glossary.json');

// Scribe limits: at most 1000 keyterms, each under 50 characters and 5 words
const MAX_KEYTERMS = 1000;
const MAX_KEYTERM_LENGTH = 49;
const MAX_KEYTERM_WORDS = 5;
const UNSUPPORTED_KEYTERM_CHARS = /[<>{}[\]\\]/;

export function readGlossary(): Glossary {
  return JSON.parse(fs.readFileSync(GLOSSARY_PATH, 'utf-8')) as Glossary;
}

function isValidKeyterm(term: string): boolean {
  return (
    term.length > 0 &&
    term.length <= MAX_KEYTERM_LENGTH &&
    term.split(/\s+/).length <= MAX_KEYTERM_WORDS &&
    !UNSUPPORTED_KEYTERM_CHARS.test(term)
  );
}

/**
 * Keyterms for one episode: the episode's own guest names and companies come
 * first (they matter most for that episode), then the shared glossary.
 * Duplicates and terms Scribe would reject are dropped.
 */
export function buildKeyterms(
  glossary: Glossary,
  meta: EpisodeMeta | undefined
): string[] {
  const episodeTerms = (meta?.guests ?? []).flatMap((guest) => [
    guest.name,
    guest.company,
  ]);

  const terms = [...episodeTerms, ...glossary.keyterms]
    .filter((term): term is string => typeof term === 'string')
    .map((term) => term.trim())
    .filter(isValidKeyterm);

  return [...new Set(terms)].slice(0, MAX_KEYTERMS);
}

/**
 * Replace every known mistranscription in the text, in list order, so put
 * longer forms (full names) before the shorter ones they contain
 */
export function applyCorrections(
  text: string,
  corrections: GlossaryCorrection[]
): string {
  return corrections.reduce(
    (result, { from, to }) => (from ? result.split(from).join(to) : result),
    text
  );
}
