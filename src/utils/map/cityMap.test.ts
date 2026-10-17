import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getLandPath, MAP_HEIGHT, MAP_WIDTH, placePoints } from './cityMap';

const vancouver = { id: 'vancouver', lat: 49.28, lon: -123.12 };
const toronto = { id: 'toronto', lat: 43.65, lon: -79.38 };
const london = { id: 'london', lat: 51.51, lon: -0.13 };
const tokyo = { id: 'tokyo', lat: 35.68, lon: 139.65 };
const all = [vancouver, toronto, london, tokyo];

describe('placePoints', () => {
  it('puts every point inside the frame in the world view', () => {
    for (const p of placePoints('world', all)) {
      assert.ok(p.x >= 0 && p.x <= MAP_WIDTH, `${p.id} x ${p.x}`);
      assert.ok(p.y >= 0 && p.y <= MAP_HEIGHT, `${p.id} y ${p.y}`);
    }
  });

  it('places points west to east like the real world', () => {
    const x = Object.fromEntries(
      placePoints('world', all).map((p) => [p.id, p.x])
    );
    assert.ok(x.vancouver < x.toronto);
    assert.ok(x.toronto < x.london);
    assert.ok(x.london < x.tokyo);
  });

  it('keeps only North American cities in the zoomed view, inside the frame', () => {
    const placed = placePoints('north-america', all);
    assert.deepEqual(
      placed.map((p) => p.id),
      ['vancouver', 'toronto']
    );
    for (const p of placed) {
      assert.ok(p.x >= 0 && p.x <= MAP_WIDTH && p.y >= 0 && p.y <= MAP_HEIGHT);
    }
  });

  it('spreads cities further apart when zoomed in', () => {
    const gap = (view: 'world' | 'north-america') => {
      const [a, b] = placePoints(view, [vancouver, toronto]);
      return Math.abs(b.x - a.x);
    };
    assert.ok(gap('north-america') > gap('world') * 2);
  });

  it('still works with no North American points at all', () => {
    assert.deepEqual(placePoints('north-america', [london, tokyo]), []);
    assert.ok(getLandPath('north-america', [london, tokyo]).startsWith('M'));
  });
});

describe('getLandPath', () => {
  it('draws land in both views', () => {
    for (const view of ['world', 'north-america'] as const) {
      const path = getLandPath(view, all);
      assert.ok(path.startsWith('M'), view);
      assert.ok(path.length > 1000, view);
    }
  });
});
