import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, it } from 'node:test';
import { findLatestEpisodesFile } from './findLatestEpisodesFile';

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function makeDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'episodes-catalog-'));
  directories.push(directory);
  return directory;
}

function addCatalog(directory: string, name: string, episodes: unknown): void {
  fs.writeFileSync(
    path.join(directory, name),
    JSON.stringify(episodes),
    'utf-8'
  );
}

function catalog(count: number): Array<{ guid: string; title: string }> {
  return Array.from({ length: count }, (_, index) => ({
    guid: `guid-${index}`,
    title: `Title ${index}`,
  }));
}

describe('findLatestEpisodesFile', () => {
  it('skips a newer partial catalog and returns the previous file', () => {
    const directory = makeDirectory();
    addCatalog(directory, '20261107-1200-episodes.json', catalog(10));
    addCatalog(directory, '20261108-1200-episodes.json', catalog(2));

    assert.equal(
      path.basename(findLatestEpisodesFile(directory)),
      '20261107-1200-episodes.json'
    );
  });

  it('uses the newest file when the catalog only grows', () => {
    const directory = makeDirectory();
    const previous = catalog(10);
    addCatalog(directory, '20261107-1200-episodes.json', previous);
    addCatalog(directory, '20261108-1200-episodes.json', [
      ...previous,
      { guid: 'guid-10', title: 'Title 10' },
    ]);

    assert.equal(
      path.basename(findLatestEpisodesFile(directory)),
      '20261108-1200-episodes.json'
    );
  });
});
