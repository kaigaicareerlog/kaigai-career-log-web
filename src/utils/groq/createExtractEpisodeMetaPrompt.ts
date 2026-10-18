import { HOSTS } from '../../constants/actors';
import {
  CITY_TAGS,
  COUNTRY_TAGS,
  ROLE_TAGS,
  TOPIC_TAGS,
  type TagDefinition,
} from '../../constants/episodeVocabulary';

export interface EpisodeMetaPromptInput {
  title: string;
  description: string;
  /** Highlights from the transcript, when the episode has one */
  highlights?: string[];
  /** Opening lines of the transcript ("[speaker] text"), where guests introduce themselves */
  transcriptOpening?: string;
}

// Keeps the prompt within Groq's free-tier token limits
const MAX_DESCRIPTION_CHARS = 900;

/** "slug (ラベル)" pairs: the model returns the ASCII slug, which is robust */
const options = (tags: readonly TagDefinition[]): string =>
  tags.map((tag) => `${tag.slug} (${tag.label})`).join(', ');

/**
 * Builds the prompt that extracts guest facts and tags for one episode.
 * The model may only choose tags from the fixed vocabulary, and must use null
 * for anything the text does not state (facts about real people are never
 * guessed).
 */
export function createExtractEpisodeMetaPrompt(
  input: EpisodeMetaPromptInput
): string {
  const hostNames = HOSTS.map((host) => host.name).join(', ');
  const description =
    input.description.length > MAX_DESCRIPTION_CHARS
      ? `${input.description.slice(0, MAX_DESCRIPTION_CHARS)}...`
      : input.description;
  const highlights = input.highlights?.length
    ? `\nHighlights:\n${input.highlights.map((h) => `- ${h}`).join('\n')}`
    : '';
  const transcriptOpening = input.transcriptOpening
    ? `\nTranscript opening (speech-to-text, may contain errors):\n${input.transcriptOpening}`
    : '';

  return `You extract structured metadata from a Japanese podcast episode. The podcast interviews Japanese people who work or have worked abroad in IT.

Rules:
- Use ONLY what the title, description, highlights and transcript opening explicitly state. Never guess. If a value is not stated, use null (or an empty list).
- The transcript opening is where guests introduce themselves: use it for the guest's position, company and where they work, but only when a speaker says it plainly.
- "guests": the interviewee(s). The podcast hosts are ${hostNames}: do NOT list a host unless the episode is explicitly about that host's own career. Special discussion episodes (特別回, 対談) with only hosts have no guests: return [].
- Part 2 episodes (後半) often continue with the same guest as part 1; extract the guest if the text names them or their job.
- guest.name: the name as written (e.g. "Naoya"), without さん.
- guest.position: a SHORT job title as stated, e.g. "SRE", "iOSエンジニア", "プロダクトマネージャー". Do not copy explanations in parentheses.
- guest.company: ONLY a proper company name (e.g. "Shopify", "Vancity"). If the text describes the company generically (e.g. "現地金融機関", "米国スタートアップ", "外資コンサル") use null.
- "roles", "countries", "cities", "topics": return ONLY slugs from the allowed lists below (the text in parentheses is just the meaning). Pick only those clearly discussed: at most 2 roles, 3 countries, 3 cities, 5 topics.
- "countries"/"cities": where the guest works or worked abroad. Do not add Japan, a partner's home country, or a company's headquarters unless the guest works there.
- Use the topic "return-to-japan" only when the GUEST now lives or works in Japan after working abroad (not for a trip to Japan or a job they had in Japan before leaving). Both parts of a two-part interview have the same guest.
- "otherPlaces": cities/countries where the guest works or worked that are missing from the lists. Usually empty.

Allowed roles: ${options(ROLE_TAGS)}
Allowed countries: ${options(COUNTRY_TAGS)}
Allowed cities: ${options(CITY_TAGS)}
Allowed topics: ${options(TOPIC_TAGS)}

Return ONLY a JSON object with exactly this shape:
{"guests":[{"name":string|null,"position":string|null,"company":string|null}],"roles":[string],"countries":[string],"cities":[string],"topics":[string],"otherPlaces":[string]}

Title: ${input.title}
Description: ${description}${highlights}${transcriptOpening}`;
}
