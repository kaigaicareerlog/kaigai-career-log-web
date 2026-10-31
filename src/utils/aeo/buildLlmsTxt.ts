import type { Actor, PodcastEpisode } from '../../types';
import { formatDate } from '../formatters';
import { toAbsoluteUrl } from '../seo/toAbsoluteUrl';

export interface LlmsTxtInput {
  siteName: string;
  description: string;
  hosts: Actor[];
  /** Episodes, newest first */
  episodes: Array<{ episode: PodcastEpisode; summary: string }>;
  /** Topic, place and company pages */
  collections: Array<{ name: string; url: string; count: number }>;
  /** Other pages worth knowing about */
  pages: Array<{ name: string; url: string; note: string }>;
}

/**
 * /llms.txt (https://llmstxt.org/): a Markdown map of the site that tells AI
 * assistants what the podcast is and where each episode's transcript lives.
 */
export function buildLlmsTxt({
  siteName,
  description,
  hosts,
  episodes,
  collections,
  pages,
}: LlmsTxtInput): string {
  const hostLines = hosts.map(
    (host) => `- ${host.name}: ${host.bio.replace(/\s+/g, ' ').trim()}`
  );
  const pageLines = pages.map(
    (page) => `- [${page.name}](${toAbsoluteUrl(page.url)}): ${page.note}`
  );
  const collectionLines = collections.map(
    (c) => `- [${c.name}](${toAbsoluteUrl(c.url)}): ${c.count}話`
  );
  const episodeLines = episodes.map(({ episode, summary }) => {
    const md = toAbsoluteUrl(`/episodes/${episode.guid}.md`);
    const date = formatDate(episode.date);
    return `- [${episode.title}](${md}): ${date}配信。${summary}`;
  });

  return `${[
    `# ${siteName}`,
    `> ${description}`,
    [
      '日本から海外に渡り、IT業界で働く人へのインタビューを毎週配信している日本語のポッドキャストです。',
      '各エピソードには文字起こしがあり、下のエピソード一覧のリンク先（.md）でハイライト・概要・全文の文字起こしをMarkdownで読めます。',
      '文字起こしは自動生成のため、誤りを含むことがあります。引用するときはエピソードページのURLを出典にしてください。',
    ].join('\n'),
    `## ホスト\n\n${hostLines.join('\n')}`,
    `## 主なページ\n\n${pageLines.join('\n')}`,
    `## テーマ・地域・企業別のエピソード一覧\n\n${collectionLines.join('\n')}`,
    `## エピソード（新しい順）\n\n${episodeLines.join('\n')}`,
  ].join('\n\n')}\n`;
}
