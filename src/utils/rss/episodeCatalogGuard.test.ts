import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MIN_RETAINED_EPISODE_RATIO,
  catalogRejectionReason,
  chooseEpisodeCatalog,
  type CatalogEpisode,
} from './episodeCatalogGuard';

function episodes(count: number, prefix = 'ep'): CatalogEpisode[] {
  return Array.from({ length: count }, (_, index) => ({
    guid: `${prefix}-${index}`,
    title: `Episode ${index}`,
  }));
}

describe('catalogRejectionReason', () => {
  it('refuses an empty catalog', () => {
    assert.equal(catalogRejectionReason([], []), 'catalog is empty');
    assert.equal(catalogRejectionReason(null, []), 'catalog is empty');
  });

  it('refuses episodes that have no guid or title', () => {
    const reason = catalogRejectionReason(
      [{ guid: 'a', title: '' }, { title: 'Title' }],
      []
    );
    assert.match(reason ?? '', /missing a guid or title/);
  });

  it('refuses duplicate guids', () => {
    assert.equal(
      catalogRejectionReason(
        [
          { guid: 'same', title: 'One' },
          { guid: 'same', title: 'Two' },
        ],
        []
      ),
      'catalog contains duplicate guids'
    );
  });

  it('allows the first catalog and a small catalog to shrink', () => {
    assert.equal(catalogRejectionReason(episodes(1), []), null);
    assert.equal(
      catalogRejectionReason(
        episodes(1),
        episodes(4).map((episode) => episode.guid!)
      ),
      null
    );
  });

  it('refuses a drop below 90% once the catalog has 5 episodes', () => {
    const existing = episodes(82).map((episode) => episode.guid!);
    const minimum = 82 * MIN_RETAINED_EPISODE_RATIO;
    assert.equal(minimum, 73.8);
    assert.equal(catalogRejectionReason(episodes(74), existing), null);
    assert.match(
      catalogRejectionReason(episodes(73), existing) ?? '',
      /fell from 82 to 73/
    );
  });

  it('refuses a same-sized catalog that replaces previous guids', () => {
    const existing = episodes(10).map((episode) => episode.guid!);
    const replaced = episodes(10, 'other');
    assert.match(
      catalogRejectionReason(replaced, existing) ?? '',
      /existing episodes were retained/
    );
  });

  it('allows a normal daily addition', () => {
    const previous = episodes(82);
    const next = [...previous, { guid: 'ep-new', title: 'New' }];
    assert.equal(
      catalogRejectionReason(
        next,
        previous.map((episode) => episode.guid!)
      ),
      null
    );
  });
});

describe('chooseEpisodeCatalog', () => {
  it('keeps the newest valid catalog', () => {
    const chosen = chooseEpisodeCatalog([
      { id: 'new', episodes: episodes(83) },
      { id: 'old', episodes: episodes(82) },
    ]);
    assert.equal(chosen?.id, 'new');
  });

  it('skips an empty or unreadable newer file', () => {
    const chosen = chooseEpisodeCatalog([
      { id: 'broken', episodes: null },
      { id: 'empty', episodes: [] },
      { id: 'good', episodes: episodes(82) },
    ]);
    assert.equal(chosen?.id, 'good');
  });

  it('skips a sharp drop and keeps the previous catalog', () => {
    const chosen = chooseEpisodeCatalog([
      { id: 'partial', episodes: episodes(10) },
      { id: 'previous', episodes: episodes(82) },
    ]);
    assert.equal(chosen?.id, 'previous');
  });

  it('returns null when every file is unusable', () => {
    assert.equal(
      chooseEpisodeCatalog([
        { id: 'empty', episodes: [] },
        { id: 'broken', episodes: null },
      ]),
      null
    );
  });

  it('does not treat a tiny middle file as the baseline', () => {
    const full = episodes(10);
    const grown = [...full, { guid: 'ep-new', title: 'New' }];
    assert.equal(
      chooseEpisodeCatalog([
        { id: 'newest-bad', episodes: episodes(4, 'other') },
        { id: 'tiny', episodes: episodes(2) },
        { id: 'full', episodes: full },
      ])?.id,
      'full'
    );
    assert.equal(
      chooseEpisodeCatalog([
        { id: 'newest-good', episodes: grown },
        { id: 'tiny', episodes: episodes(2) },
        { id: 'full', episodes: full },
      ])?.id,
      'newest-good'
    );
  });
});
