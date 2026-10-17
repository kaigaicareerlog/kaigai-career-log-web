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

  it("uses a tag's own wording when it has one", () => {
    const seo = getTagPageSeo('topic', '日本に帰国した人', 12, {
      pageHeading: '海外キャリア経験後に日本へ帰国した人のインタビュー',
      pageDescription: (count) => `帰国した人${count}話`,
    });
    assert.equal(
      seo.heading,
      '海外キャリア経験後に日本へ帰国した人のインタビュー'
    );
    assert.equal(
      seo.title,
      '海外キャリア経験後に日本へ帰国した人のインタビュー（12話）'
    );
    assert.equal(seo.description, '帰国した人12話');
  });

  it('falls back to the generic description when only a heading is given', () => {
    const seo = getTagPageSeo('topic', 'X', 3, { pageHeading: '見出し' });
    assert.equal(seo.heading, '見出し');
    assert.ok(seo.description.includes('3話'));
  });
});
