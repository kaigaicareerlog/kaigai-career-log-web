import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isSpecialEpisode } from './isSpecialEpisode';

describe('isSpecialEpisode', () => {
  it('recognises 【特別回】 anywhere in the title', () => {
    assert.equal(isSpecialEpisode('【特別回】2026年、私たちの抱負！'), true);
    assert.equal(isSpecialEpisode('お知らせ【特別回】'), true);
  });

  it('treats 【対談】 episodes as special too', () => {
    assert.equal(isSpecialEpisode('ダイニーのレイオフ騒動 【対談】'), true);
  });

  it('leaves regular interviews alone', () => {
    assert.equal(isSpecialEpisode('逆転戦略（後半）#46'), false);
    // Mentioning the words without the bracket marker doesn't count
    assert.equal(isSpecialEpisode('特別な対談について語る #12'), false);
  });
});
