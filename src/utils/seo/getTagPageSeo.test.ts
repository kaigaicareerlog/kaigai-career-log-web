import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getTagPageSeo } from './getTagPageSeo';

describe('getTagPageSeo', () => {
  it('phrases places as where people work', () => {
    const seo = getTagPageSeo('city', 'バンクーバー', 61);
    assert.equal(seo.heading, 'バンクーバーで働く日本人のインタビュー');
    assert.equal(seo.title, 'バンクーバーで働く日本人のインタビュー（61話）');
    assert.ok(seo.description.includes('61話'));
  });

  it('phrases roles and topics differently', () => {
    assert.equal(
      getTagPageSeo('role', 'SRE・インフラ', 5).heading,
      '海外で働くSRE・インフラのインタビュー'
    );
    assert.equal(
      getTagPageSeo('topic', 'ビザ・永住権', 25).heading,
      '「ビザ・永住権」に関するエピソード'
    );
  });

  it('mentions the count in every title and description', () => {
    for (const kind of ['country', 'city', 'role', 'topic'] as const) {
      const seo = getTagPageSeo(kind, 'X', 7);
      assert.ok(seo.title.includes('7話'), kind);
      assert.ok(seo.description.includes('7話'), kind);
    }
  });
});
