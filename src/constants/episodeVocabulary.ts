/**
 * Controlled vocabulary for episode tags.
 *
 * - `slug`: stable ASCII id stored in episodeMeta.json (and later used in URLs)
 * - `label`: Japanese label shown on pills; the LLM is asked to choose from these
 * - `aliases`: alternative spellings that also resolve to this tag
 * - `searchAliases`: extra words that make the tag searchable, but are too
 *   broad to resolve to it (e.g. 北米 matches both Canada and the USA)
 */

export type TagKind = 'role' | 'country' | 'city' | 'topic';

export interface TagDefinition {
  readonly slug: string;
  readonly label: string;
  readonly aliases: readonly string[];
  readonly searchAliases?: readonly string[];
}

export const ROLE_TAGS: readonly TagDefinition[] = [
  {
    slug: 'engineer',
    label: 'エンジニア',
    aliases: [
      'ソフトウェアエンジニア',
      'software engineer',
      'engineer',
      'swe',
      '開発者',
      'プログラマ',
      'バックエンド',
      'フロントエンド',
      'フルスタック',
      'モバイル',
      'iosエンジニア',
    ],
  },
  {
    slug: 'sre-infra',
    label: 'SRE・インフラ',
    aliases: ['sre', 'インフラ', 'devops', 'クラウド'],
  },
  {
    slug: 'data-ai',
    label: 'データ・AI',
    aliases: [
      'データエンジニア',
      'データサイエンティスト',
      'mlエンジニア',
      'aiエンジニア',
      '機械学習',
      'data engineer',
      'data scientist',
    ],
  },
  {
    slug: 'designer',
    label: 'デザイナー',
    aliases: ['アートディレクター', 'グラフィックデザイナー', 'ux', 'ui'],
  },
  {
    slug: 'product-manager',
    label: 'プロダクトマネージャー',
    aliases: ['pm', 'product manager', 'プロダクトマネジメント'],
  },
  {
    slug: 'engineering-manager',
    label: 'マネージャー・リード',
    aliases: [
      'em',
      'エンジニアリングマネージャー',
      'テックリード',
      'tech lead',
    ],
  },
  {
    slug: 'business',
    label: 'ビジネス職',
    aliases: [
      '営業',
      'セールス',
      'コンサル',
      'コンサルタント',
      'ファイナンス',
      'マーケティング',
      '事業開発',
    ],
  },
];

export const COUNTRY_TAGS: readonly TagDefinition[] = [
  {
    slug: 'canada',
    label: 'カナダ',
    aliases: ['canada'],
    searchAliases: ['北米', 'north america'],
  },
  {
    slug: 'usa',
    label: 'アメリカ',
    aliases: ['米国', 'usa', 'us', 'united states'],
    searchAliases: ['北米', 'north america', 'america'],
  },
  {
    slug: 'uk',
    label: 'イギリス',
    aliases: ['英国', 'uk', 'united kingdom'],
    searchAliases: ['ヨーロッパ', '欧州', 'europe'],
  },
  {
    slug: 'germany',
    label: 'ドイツ',
    aliases: ['germany'],
    searchAliases: ['ヨーロッパ', '欧州', 'europe'],
  },
];

export const CITY_TAGS: readonly TagDefinition[] = [
  { slug: 'vancouver', label: 'バンクーバー', aliases: ['vancouver'] },
  { slug: 'toronto', label: 'トロント', aliases: ['toronto'] },
  { slug: 'calgary', label: 'カルガリー', aliases: ['calgary'] },
  { slug: 'ottawa', label: 'オタワ', aliases: ['ottawa'] },
  { slug: 'waterloo', label: 'ウォータールー', aliases: ['waterloo'] },
  { slug: 'montreal', label: 'モントリオール', aliases: ['montreal'] },
  {
    slug: 'san-francisco',
    label: 'サンフランシスコ',
    aliases: ['san francisco', 'sf'],
    searchAliases: ['ベイエリア', 'シリコンバレー', 'bay area'],
  },
  { slug: 'seattle', label: 'シアトル', aliases: ['seattle'] },
  {
    slug: 'los-angeles',
    label: 'ロサンゼルス',
    aliases: ['ロス', 'los angeles', 'la'],
  },
  {
    slug: 'new-york',
    label: 'ニューヨーク',
    aliases: ['new york', 'nyc'],
  },
  { slug: 'london', label: 'ロンドン', aliases: ['london'] },
];

export const TOPIC_TAGS: readonly TagDefinition[] = [
  { slug: 'english', label: '英語', aliases: ['英語力', '英会話', 'english'] },
  {
    slug: 'visa',
    label: 'ビザ・永住権',
    aliases: ['ビザ', '就労ビザ', '永住権', 'pr', 'visa'],
    searchAliases: ['ワーホリ', 'ワーキングホリデー'],
  },
  {
    slug: 'no-experience',
    label: '未経験',
    aliases: ['異業種', '文系', '未経験からの挑戦'],
  },
  {
    slug: 'job-hunting',
    label: '就活・面接',
    aliases: ['就活', '就職活動', '面接', 'レジュメ', '履歴書', '内定'],
  },
  {
    slug: 'job-change',
    label: '転職・キャリアチェンジ',
    aliases: ['転職', 'キャリアチェンジ', '職種転換'],
  },
  { slug: 'local-hire', label: '現地採用', aliases: ['現地採用'] },
  { slug: 'layoff', label: 'レイオフ', aliases: ['layoff', '解雇'] },
  {
    slug: 'salary',
    label: '年収・お金',
    aliases: ['年収', '給与', '給料', '初任給', '報酬', '資産', 'お金'],
  },
  { slug: 'startup', label: 'スタートアップ', aliases: ['startup'] },
  {
    slug: 'big-tech',
    label: '大手・Big Tech',
    aliases: ['big tech', 'gafam', 'faang', '大手', '外資'],
  },
  {
    slug: 'return-to-japan',
    label: '帰国・日本転職',
    aliases: ['帰国', '日本転職', '日本で働く'],
  },
  {
    slug: 'study-abroad',
    label: '留学',
    aliases: ['大学', 'カレッジ', 'study abroad'],
  },
  {
    slug: 'work-style',
    label: '働き方',
    aliases: [
      'ホワイト',
      '有給',
      'フルリモート',
      'リモート',
      'ワークライフバランス',
    ],
  },
  { slug: 'ai', label: 'AI', aliases: ['ai時代', '生成ai', '機械学習'] },
  {
    slug: 'family',
    label: '家族・子育て',
    aliases: ['家族', '子育て', '家族移住'],
  },
  {
    slug: 'networking',
    label: 'ネットワーク・LinkedIn',
    aliases: ['linkedin', '人脈', 'ネットワーク'],
  },
];

export const TAG_DEFINITIONS: Record<TagKind, readonly TagDefinition[]> = {
  role: ROLE_TAGS,
  country: COUNTRY_TAGS,
  city: CITY_TAGS,
  topic: TOPIC_TAGS,
};

/** Maximum number of tags kept per kind for one episode */
export const MAX_TAGS_PER_KIND: Record<TagKind, number> = {
  role: 2,
  country: 3,
  city: 3,
  topic: 6,
};
