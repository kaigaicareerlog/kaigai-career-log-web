import { parseDurationToSeconds } from '../formatters';

/**
 * Converts an RSS duration ("00:44:12") to an ISO 8601 duration ("PT44M12S")
 * as required by schema.org `timeRequired`.
 * @returns The ISO 8601 duration, or undefined if the input can't be parsed
 */
export function toIsoDuration(duration: string): string | undefined {
  const totalSeconds = parseDurationToSeconds(duration);
  if (totalSeconds === null) {
    return undefined;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${seconds || (!hours && !minutes) ? `${seconds}S` : ''}`;
}
