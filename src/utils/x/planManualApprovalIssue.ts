import { EPISODE_GUID_PATTERN, X_POST_HOSTS } from '../../constants/xPost';
import type { PodcastEpisode } from '../../types';
import {
  planEpisodeIssueNotification,
  type EpisodeIssuePlan,
} from './planEpisodeIssueNotification';
import type { XPostLedger, XPostStatus } from './xPostLedger';

export type ManualApprovalIssuePlan =
  | { action: 'invalid_guid' }
  | { action: 'episode_missing' }
  | { action: 'already_recorded'; status: XPostStatus }
  | Extract<EpisodeIssuePlan, { action: 'create' }>;

/**
 * Accepts one UUID and returns it in lowercase.
 * Anything else, including shell metacharacters, is rejected.
 */
export function normalizeEpisodeGuid(value: string): string | null {
  const trimmed = value.trim();
  if (!EPISODE_GUID_PATTERN.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

/**
 * Plans one approval issue for a chosen episode.
 * Any existing ledger row for that episode blocks a second issue.
 * This does not post to X or change the episode flag.
 */
export function planManualApprovalIssue(input: {
  guid: string;
  episode: PodcastEpisode | null;
  ledger: XPostLedger;
}): ManualApprovalIssuePlan {
  const guid = normalizeEpisodeGuid(input.guid);
  if (!guid) return { action: 'invalid_guid' };
  if (!input.episode || input.episode.guid.toLowerCase() !== guid) {
    return { action: 'episode_missing' };
  }

  const existing = input.ledger.entries.find(
    (entry) => entry.guid.toLowerCase() === guid
  );
  if (existing) {
    return { action: 'already_recorded', status: existing.status };
  }

  const plan = planEpisodeIssueNotification({
    episode: input.episode,
    hosts: X_POST_HOSTS,
    ledger: input.ledger,
  });
  if (plan.action !== 'create') return { action: 'episode_missing' };
  return plan;
}

/**
 * Fixed refusal text. The raw guid is omitted so a bad input is not echoed.
 */
export function describeManualApprovalRefusal(
  plan: Exclude<ManualApprovalIssuePlan, { action: 'create' }>
): string {
  switch (plan.action) {
    case 'invalid_guid':
      return 'EPISODE_GUID is not a UUID. No issue was created.';
    case 'episode_missing':
      return 'That episode is not in the current catalog. No issue was created.';
    case 'already_recorded':
      return `This episode is already in the X post ledger (${plan.status}). No issue was created.`;
    default: {
      const unreachable: never = plan;
      return unreachable;
    }
  }
}
