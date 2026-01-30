/**
 * Format a tweet for the Google Form reminder to collect listener questions
 *
 * @param formUrl - The Google Form URL
 * @returns Formatted tweet text
 */
export function formatGoogleFormReminderTweet(formUrl: string): string {
  const lines = [
    '📮 お便り募集中！',
    '',
    '海外キャリアログへのお便りを募集しています！',
    '',
    '番組の感想や質問、海外キャリアについて聞いてみたいことなど、お気軽にお送りください🙌',
    '',
    `📝 ${formUrl}`,
    '',
    '#海外キャリアログ #ポッドキャスト #お便り募集',
  ];

  return lines.join('\n');
}
