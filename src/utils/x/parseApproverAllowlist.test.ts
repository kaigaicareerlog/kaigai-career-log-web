import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isAllowlisted,
  parseApproverAllowlist,
} from './parseApproverAllowlist';

describe('parseApproverAllowlist', () => {
  it('is empty when unset', () => {
    const allowlist = parseApproverAllowlist(undefined);
    assert.equal(allowlist.size, 0);
    assert.equal(isAllowlisted(allowlist, 'ryonryon'), false);
  });

  it('drops tokens that are not GitHub logins', () => {
    const allowlist = parseApproverAllowlist('*, @ryonryon, ryonryon, not a login');
    assert.deepEqual([...allowlist], ['ryonryon']);
  });

  it('matches the configured login case-insensitively and ignores others', () => {
    const allowlist = parseApproverAllowlist('RyonRyon');
    assert.equal(isAllowlisted(allowlist, 'ryonryon'), true);
    assert.equal(isAllowlisted(allowlist, 'gotoworks510'), false);
  });
});
