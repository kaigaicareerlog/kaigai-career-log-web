import type { PodcastEpisode } from '../../types';

export function formatNewEpisodeMainTweet(
  episode: PodcastEpisode,
  hosts: string
): string {
  const lines: string[] = [];

  lines.push('🎧Podcast新エピソード公開');
  lines.push('');
  lines.push(episode.title);
  lines.push('');
  lines.push('Host');
  lines.push(hosts);
  lines.push('');
  lines.push('#海外 #海外就職 #キャリア #kaigaicareerlog #ポッドキャスト');

  return lines.join('\n').trim();
}
