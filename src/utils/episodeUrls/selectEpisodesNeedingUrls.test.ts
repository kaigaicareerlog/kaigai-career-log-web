import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  readUrlUpdateRequest,
  selectEpisodesNeedingUrls,
} from './selectEpisodesNeedingUrls';

const episodes = [
  {
    guid: 'one',
    spotifyUrl: '',
    youtubeUrl: 'https://youtube.example/1',
    applePodcastUrl: '',
    amazonMusicUrl: 'https://amazon.example/1',
  },
  {
    guid: 'two',
    spotifyUrl: 'https://spotify.example/2',
    youtubeUrl: '',
    applePodcastUrl: '',
    amazonMusicUrl: '',
  },
];

const allPlatforms = {
  spotify: true,
  youtube: true,
  apple: true,
  amazon: true,
};

describe('readUrlUpdateRequest', () => {
  it('updates every platform when the daily job sets no switches', () => {
    assert.deepEqual(readUrlUpdateRequest({}), {
      spotify: true,
      youtube: true,
      apple: true,
      amazon: true,
      guid: undefined,
    });
  });

  it('turns a platform off only for the string false', () => {
    const request = readUrlUpdateRequest({
      UPDATE_SPOTIFY: 'false',
      UPDATE_YOUTUBE: 'true',
      EPISODE_GUID: ' abc ',
    });
    assert.equal(request.spotify, false);
    assert.equal(request.youtube, true);
    assert.equal(request.guid, 'abc');
  });
});

describe('selectEpisodesNeedingUrls', () => {
  it('selects only empty URLs and does not return episodes that already have one', () => {
    const selected = selectEpisodesNeedingUrls(episodes, allPlatforms);
    assert.deepEqual(
      selected.spotify.map((episode) => episode.guid),
      ['one']
    );
    assert.deepEqual(
      selected.youtube.map((episode) => episode.guid),
      ['two']
    );
    assert.deepEqual(
      selected.apple.map((episode) => episode.guid),
      ['one', 'two']
    );
    assert.deepEqual(
      selected.amazon.map((episode) => episode.guid),
      ['two']
    );
  });

  it('limits the update to one guid and the platforms that were requested', () => {
    const selected = selectEpisodesNeedingUrls(episodes, {
      ...allPlatforms,
      youtube: false,
      amazon: false,
      guid: 'two',
    });
    assert.deepEqual(selected.spotify, []);
    assert.deepEqual(selected.youtube, []);
    assert.deepEqual(selected.amazon, []);
    assert.deepEqual(
      selected.apple.map((episode) => episode.guid),
      ['two']
    );
  });
});
