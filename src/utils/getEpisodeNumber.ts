/**
 * Episode number from a title like "...（後半）#46", or null for episodes
 * without one (special episodes). Uses the last "#<digits>" in the title.
 */
export function getEpisodeNumber(title: string): number | null {
  const matches = [...title.matchAll(/#(\d+)/g)];
  const last = matches[matches.length - 1];
  return last ? Number(last[1]) : null;
}
