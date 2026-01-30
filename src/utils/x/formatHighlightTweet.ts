import type { PodcastEpisode, TranscriptJSON } from '../../types';

/**
 * Format a tweet for a podcast episode highlight
 *
 * @param episode - The podcast episode
 * @param transcript - The transcript with highlights
 * @param highlightNumber - The highlight number (1, 2, or 3)
 * @returns Formatted tweet text
 */
export function formatHighlightTweet(
  episode: PodcastEpisode,
  transcript: TranscriptJSON,
  highlightNumber: 1 | 2 | 3
): string {
  const highlightKey = `highlight${highlightNumber}` as keyof TranscriptJSON;
  const highlight = transcript[highlightKey];

  if (!highlight || typeof highlight !== 'string') {
    throw new Error(
      `Highlight ${highlightNumber} not found for episode ${episode.guid}`
    );
  }

  const lines = [
    `💡 ${highlight}`,
    '',
    `🎙️ ${episode.title}`,
    '',
    '#海外キャリアログ #ポッドキャスト',
  ];

  return lines.join('\n');
}
