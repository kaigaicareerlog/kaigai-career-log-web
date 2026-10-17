import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCollectionPageJsonLd } from './buildJsonLd';

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
