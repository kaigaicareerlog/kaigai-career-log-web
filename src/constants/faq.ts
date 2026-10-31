/**
 * Questions answered on the About page. The same text is published as
 * schema.org FAQPage, so answer engines (ChatGPT search, Perplexity, Google
 * AI Overviews) can quote a direct answer. Keep the answers factual and
 * self-contained: each one may be shown without the rest of the page.
 */
export interface FaqItem {
  question: string;
  answer: string;
  /** Optional link shown under the answer on the page */
  link?: { label: string; href: string };
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: '海外キャリアログはどんなポッドキャストですか？',
    answer:
      '日本から海外に渡り、IT業界で働く人（エンジニア、デザイナー、プロダクトマネージャーなど）にインタビューする日本語のポッドキャストです。海外を目指した理由、英語の壁、就活や面接、ビザ・永住権、現地での生活や年収まで、本人の体験をそのまま聞けます。毎週月曜に更新しています。',
  },
  {
    question: 'ホストは誰ですか？',
    answer:
      'バンクーバーでソフトウェアエンジニアとして働くRyo、IT専門職の海外就職を支援するFrog代表のSenna、バンクーバーでエンジニアを経験し日本に帰国したプロダクトマネージャーのHiroshiの3人です。',
    link: { label: 'ホスト紹介を見る', href: '#hosts' },
  },
  {
    question: 'どこで聴けますか？',
    answer:
      'Spotify、Apple Podcasts、YouTube、Amazon Musicで配信しています。このサイトの各エピソードページからも再生できます。',
  },
  {
    question: 'エピソードの文字起こしはありますか？',
    answer:
      'あります。各エピソードページで、ハイライトと全文の文字起こしを読めます。文字起こしは自動生成のため、聞き取りの誤りや話者の取り違えを含むことがあります。',
  },
  {
    question: '特定の国・都市・職種の話を探すにはどうすればいいですか？',
    answer:
      'トピック一覧で国・都市・職種・テーマ（ビザ、英語、転職など）ごとにエピソードをまとめています。ゲストの勤務先から探せる会社一覧や、ゲストが働く都市の地図もあります。',
    link: { label: 'トピック一覧を見る', href: '/tags/' },
  },
  {
    question: 'ゲスト出演や質問をしたいときは？',
    answer:
      'このページ下のメールアドレスかお便りフォームからご連絡ください。番組への感想や質問、ゲスト出演のご相談を受け付けています。',
    link: { label: 'お問い合わせへ', href: '#contact' },
  },
];
