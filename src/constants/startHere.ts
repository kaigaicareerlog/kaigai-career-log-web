/**
 * Entry points for first-time visitors ("はじめての方へ" on the home page).
 * An item points at either one episode or one tag page; it is skipped if
 * that episode or page doesn't exist (e.g. a tag below the page threshold).
 */
export type StartHereIcon = 'user' | 'sprout' | 'document';

export interface StartHereItem {
  icon: StartHereIcon;
  title: string;
  description: string;
  episodeGuid?: string;
  tagSlug?: string;
}

export const START_HERE_ITEMS: readonly StartHereItem[] = [
  {
    icon: 'user',
    title: 'ホストRyoの海外キャリア',
    description: '大学中退から北米の大手エンジニアへ。前半・後半の2話です。',
    episodeGuid: 'e73febac-5e5e-4240-a0c0-4bc74e5ae424', // #45 (前半)
  },
  {
    icon: 'sprout',
    title: '未経験から海外就職',
    description: '異業種からエンジニアになった人たちの話。',
    tagSlug: 'no-experience',
  },
  {
    icon: 'document',
    title: 'ビザと永住権',
    description: '就労ビザの取り方と、その現実。',
    tagSlug: 'visa',
  },
];
