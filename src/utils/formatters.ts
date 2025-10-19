/**
 * 日付をフォーマットする
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * 時間をフォーマットする
 */
export function formatDuration(duration: string): string {
  let totalSeconds: number;

  // HH:MM:SS形式の場合
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
      return duration;
    }
  } else {
    // 秒数の場合
    totalSeconds = parseInt(duration);
    if (isNaN(totalSeconds)) {
      return duration;
    }
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}時間${minutes}分`;
  } else {
    return `${minutes}分`;
  }
}
