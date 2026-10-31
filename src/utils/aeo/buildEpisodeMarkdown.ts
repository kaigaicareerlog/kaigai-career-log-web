import type { EpisodeGuest, PodcastEpisode } from '../../types';
import { formatDate, formatDuration } from '../formatters';

export interface EpisodeMarkdownInput {
  episode: PodcastEpisode;
  /** Absolute URL of the episode's HTML page */
  pageUrl: string;
  guests?: EpisodeGuest[];
  /** Tag labels (countries, cities, roles, topics) */
  tags?: string[];
  highlights?: string[];
  utterances?: Array<{ speaker: string; text: string; timestamp: string }>;
}

function describeGuest(guest: EpisodeGuest): string | null {
  if (!guest.name) return null;
  const role = [guest.company, guest.position].filter(Boolean).join(' ');
  return role ? `${guest.name}（${role}）` : guest.name;
}

/**
 * Plain Markdown version of an episode page (facts, highlights, description
 * and the full transcript) for AI assistants and answer engines, which read
 * Markdown far more reliably than the HTML page with its player and menus.
 */
export function buildEpisodeMarkdown({
  episode,
  pageUrl,
  guests = [],
  tags = [],
  highlights = [],
  utterances = [],
}: EpisodeMarkdownInput): string {
  const guestNames = guests.flatMap((guest) => describeGuest(guest) ?? []);
  const listenLinks = [
    ['Spotify', episode.spotifyUrl],
    ['Apple Podcasts', episode.applePodcastUrl],
    ['YouTube', episode.youtubeUrl],
    ['Amazon Music', episode.amazonMusicUrl],
  ].flatMap(([label, url]) => (url ? [`[${label}](${url})`] : []));

  const facts = [
    `- ページ: ${pageUrl}`,
    `- 配信日: ${formatDate(episode.date)}`,
    `- 長さ: ${formatDuration(episode.duration)}`,
    ...(guestNames.length > 0 ? [`- ゲスト: ${guestNames.join('、')}`] : []),
    ...(tags.length > 0 ? [`- タグ: ${tags.join('、')}`] : []),
    ...(listenLinks.length > 0 ? [`- 聴く: ${listenLinks.join(' / ')}`] : []),
  ];

  const sections = [
    `# ${episode.title}`,
    `ポッドキャスト「海外キャリアログ」のエピソードです。`,
    facts.join('\n'),
  ];

  if (highlights.length > 0) {
    sections.push(
      `## ハイライト\n\n${highlights.map((h) => `- ${h}`).join('\n')}`
    );
  }

  sections.push(`## エピソード概要\n\n${episode.description.trim()}`);

  if (utterances.length > 0) {
    const lines = utterances.map(
      (u) => `**${u.speaker}** (${u.timestamp}): ${u.text.trim()}`
    );
    sections.push(
      `## 文字起こし\n\n自動文字起こしのため、誤りや話者の取り違えを含むことがあります。\n\n${lines.join('\n\n')}`
    );
  }

  return `${sections.join('\n\n')}\n`;
}
