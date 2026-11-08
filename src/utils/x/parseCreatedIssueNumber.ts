/**
 * Reads the issue number from a `gh issue create` URL.
 * Returns null when the output is not exactly one issue URL.
 */
export function parseCreatedIssueNumber(issueUrl: string): number | null {
  const match = issueUrl.trim().match(/\/issues\/([1-9][0-9]*)\s*$/);
  if (!match?.[1]) return null;
  const issueNumber = Number(match[1]);
  if (
    !Number.isInteger(issueNumber) ||
    issueNumber <= 0 ||
    issueNumber > 1_000_000_000
  ) {
    return null;
  }
  return issueNumber;
}
