// Almost every description opens with this same line, which makes a list of
// cards look repetitive. It adds nothing once the reader is on the podcast's
// own site.
const BOILERPLATE_INTRO =
  '海外でキャリアを築いているIT業界のスペシャリストにインタビュー！';

/**
 * Description text for list cards: the shared intro line is removed so each
 * card starts with what is specific to that episode.
 */
export function getEpisodeExcerpt(description: string): string {
  const trimmed = description.trim();
  return trimmed.startsWith(BOILERPLATE_INTRO)
    ? trimmed.slice(BOILERPLATE_INTRO.length).trim()
    : trimmed;
}
