/**
 * Replaces known secret values in a log line.
 * Short values are left alone so empty strings do not erase the line.
 */
export function redactSecrets(
  text: string,
  secrets: readonly string[]
): string {
  const unique = [...new Set(secrets.filter((secret) => secret.length >= 4))];
  unique.sort((left, right) => right.length - left.length);
  let redacted = text;
  for (const secret of unique) {
    redacted = redacted.split(secret).join('[redacted]');
  }
  return redacted;
}
