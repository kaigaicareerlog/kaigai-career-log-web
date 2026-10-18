import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { splitEpisodeTitle } from './splitEpisodeTitle';

describe('splitEpisodeTitle', () => {
  it('splits off the half label and episode number', () => {
    assert.deepEqual(
      splitEpisodeTitle('文系職で勝ち抜く北米就活戦略（前半）#66'),
      {
        main: '文系職で勝ち抜く北米就活戦略',
        part: '前半',
        special: null,
        number: '66',
      }
    );
  });

  it('handles a space before the number and ASCII brackets', () => {
    assert.deepEqual(splitEpisodeTitle('就活戦略(後半) #38'), {
      main: '就活戦略',
      part: '後半',
      special: null,
      number: '38',
    });
  });

  it('takes the special-episode label out of the title', () => {
    assert.deepEqual(splitEpisodeTitle('レイオフ文化について 【対談】'), {
      main: 'レイオフ文化について',
      part: null,
      special: '対談',
      number: null,
    });
  });
});
