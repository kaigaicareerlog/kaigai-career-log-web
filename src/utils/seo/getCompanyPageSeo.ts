import type { CompanyGuest } from '../episodeMeta/getCompanyPages';

export interface CompanyPageSeo {
  /** On-page <h1> */
  heading: string;
  /** Page <title>, without the site name */
  title: string;
  description: string;
}

/**
 * Heading, title and meta description for a company page, worded the way
 * people search (「Shopify 日本人 エンジニア」).
 */
export function getCompanyPageSeo(
  name: string,
  count: number,
  guests: CompanyGuest[]
): CompanyPageSeo {
  const positions = [
    ...new Set(guests.map((g) => g.position).filter(Boolean)),
  ].join('・');
  const who = positions ? `日本人${positions}` : '日本人';
  const heading = `${name}で働く日本人のインタビュー`;

  return {
    heading,
    title: `${heading}（${count}話）`,
    description: `${name}で働く（働いていた）${who}へのインタビュー${count}話。入社までの就活や面接、現地での働き方を本人の言葉で聞けます。`,
  };
}
