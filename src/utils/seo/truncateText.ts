/**
 * Collapses whitespace/newlines and truncates text to `maxLength` characters,
 * appending an ellipsis when it was cut. Used for meta descriptions.
 */
export function truncateText(text: string, maxLength: number): string {
  const singleLine = text.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= maxLength) {
    return singleLine;
  }
  return `${singleLine.slice(0, maxLength - 1)}…`;
}
