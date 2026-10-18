import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { countLines, estimateEms, fitTitleFontSize } from './fitTitle';

describe('estimateEms', () => {
  it('counts Japanese as 1em and Latin as 0.6em', () => {
    assert.equal(estimateEms('海外'), 2);
    assert.equal(estimateEms('Telus'), 3);
  });
});

describe('countLines', () => {
  it('wraps between phrases', () => {
    // 3 + 3 + 3 ems at 10px = 30px each, 70px wide: two per line
    assert.equal(countLines(['あいう', 'えおか', 'きくけ'], 10, 70), 2);
  });
});

describe('fitTitleFontSize', () => {
  it('keeps the largest size for a short title', () => {
    assert.equal(fitTitleFontSize(['短いタイトル'], 1072), 54);
  });

  it('shrinks a long title so it fits in three lines', () => {
    const phrases = Array.from({ length: 12 }, () => 'あいうえお');
    const size = fitTitleFontSize(phrases, 1072);
    assert.ok(size < 54);
    assert.ok(countLines(phrases, size, 1072) <= 3);
  });
});
