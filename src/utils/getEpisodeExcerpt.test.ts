import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getEpisodeExcerpt } from './getEpisodeExcerpt';

describe('getEpisodeExcerpt', () => {
  it('removes the shared intro line', () => {
    assert.equal(
      getEpisodeExcerpt(
        '海外でキャリアを築いているIT業界のスペシャリストにインタビュー！今回のゲストはMisuzuさん。'
      ),
      '今回のゲストはMisuzuさん。'
    );
  });

  it('leaves other descriptions unchanged', () => {
    assert.equal(getEpisodeExcerpt('  特別回です。 '), '特別回です。');
  });
});
