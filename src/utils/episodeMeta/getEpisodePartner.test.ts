import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EpisodeMetaMap, PodcastEpisode } from '../../types';
import { getEpisodePartner } from './getEpisodePartner';

const ep = (guid: string, title: string): PodcastEpisode => ({
  guid,
  title,
  description: '',
  duration: '00:30:00',
  date: '',
  link: '',
  audioUrl: '',
});
const meta = (name: string | null) => ({
  guests: name ? [{ name, position: null, company: null }] : [],
  roles: [],
  countries: [],
  cities: [],
  topics: [],
  reviewed: false,
});

// Newest first, as the site stores them
const episodes = [
  ep('b2', 'B（後半）#9'),
  ep('b1', 'B（前半）#8'),
  ep('special', '【特別回】みんなで話す'),
  ep('a2', 'A（後半）#7'),
  ep('a1', 'A（前半）#6'),
];
const map: EpisodeMetaMap = {
  a1: meta('Naoya'),
  a2: meta('naoya'),
  b1: meta('Kei'),
  b2: meta('Kei'),
};

describe('getEpisodePartner', () => {
  it('pairs a 後半 with the 前半 published just before it', () => {
    const partner = getEpisodePartner(episodes[0], episodes, map);
    assert.equal(partner?.episode.guid, 'b1');
    assert.equal(partner?.label, '前半');
  });

  it('pairs a 前半 with the 後半 published just after it', () => {
    const partner = getEpisodePartner(episodes[4], episodes, map);
    assert.equal(partner?.episode.guid, 'a2');
    assert.equal(partner?.label, '後半');
  });

  it('matches guest names regardless of case', () => {
    assert.equal(
      getEpisodePartner(episodes[3], episodes, map)?.episode.guid,
      'a1'
    );
  });

  it('pairs across a special episode published in between', () => {
    const split = [
      ep('x2', 'X（後半）#12'),
      ep('special', '【特別回】みんなで話す'),
      ep('x1', 'X（前半）#11'),
    ];
    assert.equal(getEpisodePartner(split[0], split, {})?.episode.guid, 'x1');
    assert.equal(getEpisodePartner(split[2], split, {})?.episode.guid, 'x2');
  });

  it('gives specials no partner', () => {
    const split = [ep('s', '【特別回】みんなで話す'), ep('x1', 'X（前半）#11')];
    assert.equal(getEpisodePartner(split[0], split, {}), null);
  });

  it('does not jump over another two-part episode', () => {
    const split = [
      ep('x2', 'X（後半）#12'),
      ep('y2', 'Y（後半）#11'),
      ep('x1', 'X（前半）#10'),
    ];
    assert.equal(getEpisodePartner(split[0], split, {}), null);
  });

  it('gives up after a few specials', () => {
    const split = [
      ep('x2', 'X（後半）#12'),
      ep('s1', '特別回1'),
      ep('s2', '特別回2'),
      ep('s3', '特別回3'),
      ep('s4', '特別回4'),
      ep('x1', 'X（前半）#11'),
    ];
    assert.equal(getEpisodePartner(split[0], split, {}), null);
  });

  it('accepts the same name written in different scripts', () => {
    const split = [ep('k2', 'K（後半）#10'), ep('k1', 'K（前半）#9')];
    const names: EpisodeMetaMap = { k1: meta('Kei'), k2: meta('ケイ') };
    assert.equal(getEpisodePartner(split[0], split, names)?.episode.guid, 'k1');
  });

  it('never pairs a special episode with a regular one', () => {
    const split = [
      ep('x2', 'X（後半）#12'),
      ep('sp', '【特別回】みんなで話す（前半）'),
    ];
    assert.equal(getEpisodePartner(split[0], split, {}), null);
    assert.equal(getEpisodePartner(split[1], split, {}), null);
  });

  it('pairs two-part specials across a regular two-part episode', () => {
    const split = [
      ep('s2', '【特別回】対談（後半）'),
      ep('x2', 'X（後半）#12'),
      ep('s1', '【特別回】対談（前半）'),
      ep('x1', 'X（前半）#11'),
    ];
    assert.equal(getEpisodePartner(split[0], split, {})?.episode.guid, 's1');
    assert.equal(getEpisodePartner(split[1], split, {})?.episode.guid, 'x1');
  });

  it('refuses a pair whose guest names disagree in the same script', () => {
    const mismatched = { ...map, b1: meta('Someone Else') };
    assert.equal(getEpisodePartner(episodes[0], episodes, mismatched), null);
  });

  it('still pairs when a guest name is missing', () => {
    const noName = { ...map, b1: meta(null) };
    assert.equal(
      getEpisodePartner(episodes[0], episodes, noName)?.episode.guid,
      'b1'
    );
  });
});
