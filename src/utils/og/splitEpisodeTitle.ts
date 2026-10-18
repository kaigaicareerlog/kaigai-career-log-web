export interface EpisodeTitleParts {
  /** Title without the half label and episode number */
  main: string;
  /** '前半' or '後半' for two-part interviews */
  part: '前半' | '後半' | null;
  /** Label of a special episode, e.g. '対談' from 【対談】 */
  special: string | null;
  /** Episode number from the trailing "#66" */
  number: string | null;
}

/**
 * Split "…（前半）#66" into the title text, the half label and the number
 * (and "【対談】" into a special label), so the share image can show the
 * labels separately from the title.
 */
export function splitEpisodeTitle(title: string): EpisodeTitleParts {
  const number = title.match(/#(\d+)\s*$/)?.[1] ?? null;
  const part =
    (title.match(/[（(](前半|後半)[）)]/)?.[1] as
      | '前半'
      | '後半'
      | undefined) ?? null;
  const special = title.match(/【([^】]+)】/)?.[1] ?? null;
  const main = title
    .replace(/\s*#\d+\s*$/, '')
    .replace(/\s*[（(](前半|後半)[）)]\s*/, '')
    .replace(/\s*【[^】]+】\s*/, ' ')
    .trim();
  return { main, part, special, number };
}
