import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatDate } from './formatters';

describe('formatDate', () => {
  it('shows the date in Japan time, not UTC', () => {
    // Sunday 21:30 UTC is Monday 06:30 in Japan
    assert.equal(formatDate('Sun, 11 Oct 2026 21:30:00 GMT'), '2026年10月12日');
  });

  it('does not depend on the machine timezone', () => {
    // Early Japan morning on the 1st is still the last day of the month in UTC
    assert.equal(formatDate('Sat, 31 Oct 2026 20:00:00 GMT'), '2026年11月1日');
  });
});
