/**
 * 日付をフォーマットする（日本時間）
 *
 * Episodes go out around 06:30 JST, which is the previous evening in UTC. The
 * timezone is fixed so the site shows the date listeners in Japan see, instead
 * of whatever timezone the build server happens to use.
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Parses timestamp from filename in format YYYYMMDD-HHMM
 * @param filename - The filename containing the timestamp
 * @returns Date object or null if parsing fails
 */
export function parseTimestampFromFilename(filename: string): Date | null {
  // Extract timestamp pattern like 20251112-0815
  const match = filename.match(/(\d{8})-(\d{4})/);
  if (!match) return null;

  const dateStr = match[1]; // YYYYMMDD
  const timeStr = match[2]; // HHMM

  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-indexed
  const day = parseInt(dateStr.substring(6, 8));
  const hour = parseInt(timeStr.substring(0, 2));
  const minute = parseInt(timeStr.substring(2, 4));

  return new Date(year, month, day, hour, minute);
}

/**
 * Formats milliseconds as a transcript timestamp ("MM:SS", minutes not capped)
 */
export function formatTimestamp(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

/**
 * Parses an RSS duration ("HH:MM:SS", "MM:SS" or plain seconds) into seconds
 * @returns Total seconds, or null if the format is not recognised
 */
export function parseDurationToSeconds(duration: string): number | null {
  let totalSeconds: number;

  if (duration.includes(':')) {
    const parts = duration.split(':');
    if (parts.length === 3) {
      // HH:MM:SS
      totalSeconds =
        parseInt(parts[0]) * 3600 +
        parseInt(parts[1]) * 60 +
        parseInt(parts[2]);
    } else if (parts.length === 2) {
      // MM:SS
      totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else {
      return null;
    }
  } else {
    // 秒数の場合
    totalSeconds = parseInt(duration);
  }

  return isNaN(totalSeconds) ? null : totalSeconds;
}

/**
 * 時間をフォーマットする
 */
export function formatDuration(duration: string): string {
  const totalSeconds = parseDurationToSeconds(duration);
  if (totalSeconds === null) {
    return duration;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}時間${minutes}分`;
  } else {
    return `${minutes}分`;
  }
}
