import { X_POST_HOSTS } from '../../constants/xPost';
import type { PodcastEpisode } from '../../types';
import { truncateText } from '../seo';
import { buildEpisodePostIssueBody } from './buildEpisodePostIssueBody';
import { buildNewEpisodePostTexts } from './buildNewEpisodePostTexts';
import type { XPostLedger } from './xPostLedger';

const ISSUE_TITLE_MAX_CHARS = 80;

export type EpisodeIssuePlan =
  | { action: 'none' }
  | { action: 'invalid_hosts' }
  | { action: 'mark_flag_only'; guid: string }
  | {
      action: 'create';
      guid: string;
      title: string;
      body: string;
      mainText: string;
      replyText: string;
    };

/**
 * Plans the daily issue for one unposted episode.
 * An existing ledger row means the issue already exists, so no second issue is created.
 */
export function planEpisodeIssueNotification(input: {
  episode: PodcastEpisode | null;
  hosts: string;
  ledger: XPostLedger;
}): EpisodeIssuePlan {
  if (!input.episode) return { action: 'none' };
  if (input.hosts !== X_POST_HOSTS) return { action: 'invalid_hosts' };
  const existing = input.ledger.entries.find(
    (entry) => entry.guid === input.episode?.guid
  );
  if (existing) return { action: 'mark_flag_only', guid: input.episode.guid };

  const texts = buildNewEpisodePostTexts(input.episode);
  return {
    action: 'create',
    guid: input.episode.guid,
    title: `📣 Xに投稿: ${truncateText(input.episode.title, ISSUE_TITLE_MAX_CHARS)}`,
    body: buildEpisodePostIssueBody({
      guid: input.episode.guid,
      episodePageUrl: texts.episodePageUrl,
      shareImageUrl: texts.shareImageUrl,
      mainTweetText: texts.mainText,
      urlsTweetText: texts.replyText,
    }),
    mainText: texts.mainText,
    replyText: texts.replyText,
  };
}
