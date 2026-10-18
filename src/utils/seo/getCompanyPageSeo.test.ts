import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getCompanyPageSeo } from './getCompanyPageSeo';

describe('getCompanyPageSeo', () => {
  it('names the company and the guests positions', () => {
    const seo = getCompanyPageSeo('Shopify', 2, [
      { name: 'Yusei', position: 'SRE' },
      { name: 'Aki', position: null },
    ]);
    assert.equal(seo.title, 'Shopifyで働く日本人のインタビュー（2話）');
    assert.match(
      seo.description,
      /^Shopifyで働く（働いていた）日本人SREへのインタビュー2話。/
    );
  });

  it('works without positions', () => {
    const seo = getCompanyPageSeo('AWS', 1, [{ name: 'Ken', position: null }]);
    assert.match(seo.description, /日本人へのインタビュー1話/);
  });
});
