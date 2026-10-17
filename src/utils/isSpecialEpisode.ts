// Special episodes are marked in the title: 【特別回】 for one-off episodes,
// 【対談】 for talks that aren't a regular guest interview.
const SPECIAL_MARKER = /【(特別回|対談)】/;

/** True for 特別回 (anything that isn't a regular numbered interview). */
export function isSpecialEpisode(title: string): boolean {
  return SPECIAL_MARKER.test(title);
}
