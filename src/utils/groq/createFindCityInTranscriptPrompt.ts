import {
  CITY_TAGS,
  type TagDefinition,
} from '../../constants/episodeVocabulary';

export interface FindCityInTranscriptInput {
  title: string;
  description: string;
  /** Full transcript text, already truncated to fit the model's context */
  transcriptExcerpt: string;
}

const options = (tags: readonly TagDefinition[]): string =>
  tags.map((tag) => `${tag.slug} (${tag.label})`).join(', ');

/**
 * Builds a prompt that searches a full episode transcript for an explicit
 * statement of the guest's city, when the title/description didn't mention
 * one. Used for one-off backfilling (see scripts/backfill-city-tags.ts), not
 * the regular per-episode tagging pipeline.
 */
export function createFindCityInTranscriptPrompt(
  input: FindCityInTranscriptInput
): string {
  return `You read a Japanese podcast transcript to find where the interview guest currently lives or works. The episode's title/description didn't mention a city, but the guest may have said it out loud during the conversation.

Rules:
- Only count an EXPLICIT statement that the guest lives or works in a city (e.g. "今はバンクーバーに住んでいます", "トロントのオフィスで働いています").
- Do NOT count a city mentioned only in passing - visiting, a friend's location, a company's other offices, a past city they moved away from, or the interviewer's own city.
- Choose ONLY from this list, returning the slug: ${options(CITY_TAGS)}
- If the city is stated but is not in that list, put it in "otherCity" as free text instead.
- If nothing qualifies, "city" and "otherCity" must both be null.
- "evidence": a short quote or close paraphrase (in Japanese) of the sentence that states it, or null.

Return ONLY a JSON object: {"city": string|null, "otherCity": string|null, "evidence": string|null}

Title: ${input.title}
Description: ${input.description}

Transcript:
${input.transcriptExcerpt}`;
}
