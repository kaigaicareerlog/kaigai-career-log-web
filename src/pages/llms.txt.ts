import type { APIRoute } from 'astro';
import { ACTIVE_HOSTS } from '../constants/actors';
import { SITE_DEFAULT_DESCRIPTION, SITE_NAME } from '../constants/site';
import { buildLlmsTxt } from '../utils/aeo/buildLlmsTxt';
import { readEpisodeMetaMap } from '../utils/episodeMeta/episodeMetaFile';
import {
  getCompanyPagePath,
  getCompanyPages,
} from '../utils/episodeMeta/getCompanyPages';
import { getTagPagePath, getTagPages } from '../utils/episodeMeta/getTagPages';
import { findTagBySlug } from '../utils/episodeMeta/resolveTag';
import { getLatestEpisodes } from '../utils/getLatestEpisodes';
import { getCompanyPageSeo } from '../utils/seo/getCompanyPageSeo';
import { getTagPageSeo } from '../utils/seo/getTagPageSeo';
import { truncateText } from '../utils/seo';

const SUMMARY_MAX_LENGTH = 150;

// Most descriptions open with the same line; skip it so the summary says
// something about the episode itself
const COMMON_DESCRIPTION_OPENING =
  /^\s*海外でキャリアを築いているIT業界のスペシャリストにインタビュー[！!]\s*/;

export const GET: APIRoute = async () => {
  const { episodes } = await getLatestEpisodes();
  const metaMap = readEpisodeMetaMap();

  const tagCollections = getTagPages(episodes, metaMap).map((page) => ({
    name: getTagPageSeo(
      page.kind,
      page.label,
      page.episodes.length,
      findTagBySlug(page.kind, page.slug) ?? {}
    ).heading,
    url: getTagPagePath(page.slug),
    count: page.episodes.length,
  }));
  const companyCollections = getCompanyPages(episodes, metaMap).map(
    (company) => ({
      name: getCompanyPageSeo(
        company.name,
        company.episodes.length,
        company.guests
      ).heading,
      url: getCompanyPagePath(company.slug),
      count: company.episodes.length,
    })
  );

  const body = buildLlmsTxt({
    siteName: SITE_NAME,
    description: SITE_DEFAULT_DESCRIPTION,
    hosts: ACTIVE_HOSTS,
    pages: [
      { name: 'トップ', url: '/', note: '最新エピソードと番組の紹介' },
      {
        name: '番組について・よくある質問',
        url: '/about/',
        note: 'ホスト紹介、配信先、よくある質問、お問い合わせ',
      },
      {
        name: 'トピック一覧',
        url: '/tags/',
        note: '国・都市・職種・テーマ別のエピソード',
      },
      { name: '会社一覧', url: '/companies/', note: 'ゲストの勤務先別' },
      { name: '都市マップ', url: '/cities/', note: 'ゲストが働く都市の地図' },
    ],
    collections: [...tagCollections, ...companyCollections],
    episodes: episodes.map((episode) => ({
      episode,
      summary: truncateText(
        episode.description.replace(COMMON_DESCRIPTION_OPENING, ''),
        SUMMARY_MAX_LENGTH
      ),
    })),
  });

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
