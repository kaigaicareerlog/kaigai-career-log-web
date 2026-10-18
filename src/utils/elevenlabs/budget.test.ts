import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertWithinBudget,
  estimateCostUsd,
  monthKey,
  recordUsage,
} from './budget';

describe('estimateCostUsd', () => {
  it('charges per hour and adds the keyterm surcharge', () => {
    assert.equal(
      estimateCostUsd(3600, { withKeyterms: false, usdPerHour: 0.25 }),
      0.25
    );
    assert.equal(
      estimateCostUsd(3600, { withKeyterms: true, usdPerHour: 0.25 }),
      0.3
    );
  });
});

describe('assertWithinBudget', () => {
  const usage = {
    '2026-10': { audioSeconds: 0, estimatedUsd: 4.8, episodes: [] },
  };

  it('allows a call that fits in the budget', () => {
    assertWithinBudget({
      usage,
      month: '2026-10',
      audioSeconds: 3600,
      estimatedUsd: 0.2,
      monthlyBudgetUsd: 5,
    });
  });

  it('refuses a call that would go over the budget', () => {
    assert.throws(
      () =>
        assertWithinBudget({
          usage,
          month: '2026-10',
          audioSeconds: 3600,
          estimatedUsd: 0.3,
          monthlyBudgetUsd: 5,
        }),
      /budget exceeded/
    );
  });

  it('starts each month from zero', () => {
    assertWithinBudget({
      usage,
      month: '2026-11',
      audioSeconds: 3600,
      estimatedUsd: 0.3,
      monthlyBudgetUsd: 5,
    });
  });

  it('refuses audio over two hours', () => {
    assert.throws(
      () =>
        assertWithinBudget({
          usage: {},
          month: '2026-10',
          audioSeconds: 3 * 3600,
          estimatedUsd: 0.1,
          monthlyBudgetUsd: 5,
        }),
      /minute limit/
    );
  });
});

describe('recordUsage', () => {
  it('adds to the month total', () => {
    const once = recordUsage({}, '2026-10', 'a', 100, 0.01);
    const twice = recordUsage(once, '2026-10', 'b', 50, 0.02);
    assert.deepEqual(twice['2026-10'], {
      audioSeconds: 150,
      estimatedUsd: 0.03,
      episodes: ['a', 'b'],
    });
  });
});

describe('monthKey', () => {
  it('uses the UTC month', () => {
    assert.equal(monthKey(new Date('2026-10-31T23:00:00Z')), '2026-10');
  });
});
