const GITHUB_LOGIN = /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/;

/**
 * Parses `X_POST_APPROVER_LOGINS`.
 * Empty, missing, or non-login tokens produce an empty set.
 * An empty set means nobody can publish.
 */
export function parseApproverAllowlist(
  raw: string | undefined
): ReadonlySet<string> {
  if (!raw) return new Set();
  const logins = raw
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter((part) => GITHUB_LOGIN.test(part));
  return new Set(logins);
}

/**
 * True only when the allowlist is non-empty and contains this login.
 * Comparison is case-insensitive because GitHub logins are.
 */
export function isAllowlisted(
  allowlist: ReadonlySet<string>,
  login: string
): boolean {
  if (allowlist.size === 0) return false;
  return allowlist.has(login.trim().toLowerCase());
}
