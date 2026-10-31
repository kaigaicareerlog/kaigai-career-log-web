import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PodcastEpisode } from '../../types';
import {
  buildCollectionPageJsonLd,
  buildFaqPageJsonLd,
  buildPodcastEpisodeJsonLd,
  buildPodcastSeriesJsonLd,
} from './buildJsonLd';

describe('buildPodcastEpisodeJsonLd', () => {
  const episode: PodcastEpisode = {
    guid: 'g',
    title: 'タイトル',
    description: '説明',
    duration: '00:46:18',
    date: 'Sun, 11 Oct 2026 00:46:18 GMT',
    link: '',
    audioUrl: 'https://example.com/a.mp3',
    spotifyUrl: 'https://open.spotify.com/episode/x',
    youtubeUrl: '',
  };

  it('adds hosts, guests, keywords and platform links', () => {
    const json = buildPodcastEpisodeJsonLd(
      episode,
      'https://kaigaicareerlog.com/episodes/g/',
      {
        hostNames: ['Ryo'],
        guests: [
          {
            name: 'Yu',
            position: 'マーケティングスペシャリスト',
            company: 'Telus',
          },
          { name: null, position: null, company: null },
        ],
        keywords: ['カナダ', 'バンクーバー'],
      }
    ) as any;

    assert.deepEqual(json.actor, [
      { '@type': 'Person', name: 'Ryo' },
      {
        '@type': 'Person',
        name: 'Yu',
        jobTitle: 'マーケティングスペシャリスト',
        worksFor: { '@type': 'Organization', name: 'Telus' },
      },
    ]);
    assert.equal(json.keywords, 'カナダ, バンクーバー');
    assert.deepEqual(json.sameAs, ['https://open.spotify.com/episode/x']);
  });

  it('leaves the fields out when nothing is known', () => {
    const json = buildPodcastEpisodeJsonLd(
      { ...episode, spotifyUrl: undefined },
      'https://kaigaicareerlog.com/episodes/g/'
    ) as any;
    assert.equal('actor' in json, false);
    assert.equal('keywords' in json, false);
    assert.equal('sameAs' in json, false);
  });
});

describe('buildCollectionPageJsonLd', () => {
  const json = buildCollectionPageJsonLd({
    name: 'テスト',
    description: '説明',
    url: '/tags/visa/',
    episodeUrls: ['/episodes/a/', '/episodes/b/'],
  }) as any;

  it('describes the page with absolute URLs', () => {
    assert.equal(json['@type'], 'CollectionPage');
    assert.equal(json.url, 'https://kaigaicareerlog.com/tags/visa/');
  });

  it('lists the episodes in order', () => {
    assert.equal(json.mainEntity.numberOfItems, 2);
    assert.deepEqual(
      json.mainEntity.itemListElement.map((item: any) => item.position),
      [1, 2]
    );
    assert.equal(
      json.mainEntity.itemListElement[0].url,
      'https://kaigaicareerlog.com/episodes/a/'
    );
  });
});

describe('buildPodcastEpisodeJsonLd image and transcript', () => {
  const json = buildPodcastEpisodeJsonLd(
    {
      guid: 'g',
      title: 'T',
      description: '',
      duration: '00:01:00',
      date: '',
      link: '',
      audioUrl: '',
    },
    'https://kaigaicareerlog.com/episodes/g/',
    { image: '/og/episodes/g.png', transcriptUrl: '/episodes/g.md' }
  ) as any;

  it('uses absolute URLs', () => {
    assert.equal(json.image, 'https://kaigaicareerlog.com/og/episodes/g.png');
    assert.equal(
      json.subjectOf.url,
      'https://kaigaicareerlog.com/episodes/g.md'
    );
    assert.equal(
      json.partOfSeries['@id'],
      'https://kaigaicareerlog.com/#podcast'
    );
  });
});

describe('buildPodcastSeriesJsonLd', () => {
  it('lists hosts as authors with their profiles', () => {
    const json = buildPodcastSeriesJsonLd([
      {
        name: 'Ryo',
        bio: 'bio',
        avatar: '/ryo.JPG',
        color: '',
        socialLinks: [{ href: 'https://x.com/r', icon: '', title: 'X' }],
      },
    ]) as any;
    assert.deepEqual(json.author[0].sameAs, ['https://x.com/r']);
    assert.equal(json.author[0].image, 'https://kaigaicareerlog.com/ryo.JPG');
  });
});

describe('buildFaqPageJsonLd', () => {
  it('turns each item into a Question with an accepted Answer', () => {
    const json = buildFaqPageJsonLd([{ question: 'Q?', answer: 'A.' }]) as any;
    assert.equal(json['@type'], 'FAQPage');
    assert.deepEqual(json.mainEntity[0], {
      '@type': 'Question',
      name: 'Q?',
      acceptedAnswer: { '@type': 'Answer', text: 'A.' },
    });
  });
});
