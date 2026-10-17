import type { TagDefinition, TagKind } from '../../constants/episodeVocabulary';

export interface TagPageSeo {
  /** On-page <h1> */
  heading: string;
  /** Page <title>, without the site name */
  title: string;
  description: string;
}

/**
 * Heading, title and meta description for a tag page. The wording follows
 * what people actually search for (「バンクーバー 日本人 エンジニア」,
 * 「ビザ 海外就職」) instead of just repeating the tag name.
 */
export function getTagPageSeo(
  kind: TagKind,
  label: string,
  count: number,
  overrides: Pick<TagDefinition, 'pageHeading' | 'pageDescription'> = {}
): TagPageSeo {
  if (overrides.pageHeading) {
    return {
      heading: overrides.pageHeading,
      title: `${overrides.pageHeading}（${count}話）`,
      description:
        overrides.pageDescription?.(count) ??
        getTagPageSeo(kind, label, count).description,
    };
  }

  switch (kind) {
    case 'country':
    case 'city': {
      const heading = `${label}で働く日本人のインタビュー`;
      return {
        heading,
        title: `${heading}（${count}話）`,
        description: `${label}で働く日本人エンジニア・専門職へのインタビュー${count}話。就活、ビザ、英語、年収まで、現地のリアルな声を聞けます。`,
      };
    }
    case 'role': {
      const heading = `海外で働く${label}のインタビュー`;
      return {
        heading,
        title: `${heading}（${count}話）`,
        description: `海外で働く${label}の日本人へのインタビュー${count}話。海外就職までの道のりと現地での働き方を本人の言葉で聞けます。`,
      };
    }
    case 'topic': {
      const heading = `「${label}」に関するエピソード`;
      return {
        heading,
        title: `${heading}（${count}話）`,
        description: `海外で働く日本人が語る「${label}」のリアルな体験談を${count}話まとめました。海外就職・海外エンジニア転職を考える人のためのポッドキャスト。`,
      };
    }
  }
}
