import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getEpisodeNumber } from './getEpisodeNumber';

describe('getEpisodeNumber', () => {
  it('reads the number at the end of the title', () => {
    assert.equal(getEpisodeNumber('逆転戦略（後半）#46'), 46);
    assert.equal(getEpisodeNumber('キャリア戦略（前半） #38'), 38);
  });

  it('uses the last number when there are several', () => {
    assert.equal(getEpisodeNumber('#1 の続き #7'), 7);
  });

  it('is null for episodes without a number', () => {
    assert.equal(getEpisodeNumber('【特別回】海外エンジニア3人が語る'), null);
  });
});
