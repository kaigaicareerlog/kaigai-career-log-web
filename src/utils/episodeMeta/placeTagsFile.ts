import fs from 'fs';
import path from 'path';
import {
  CITY_TAGS,
  COUNTRY_TAGS,
  type PlaceTagsFile,
} from '../../constants/episodeVocabulary';
import type { NewPlace } from './parseEpisodeMeta';

const PLACE_TAGS_PATH = path.join(
  process.cwd(),
  'src',
  'data',
  'placeTags.json'
);

/**
 * Adds countries/cities found in a new episode to src/data/placeTags.json
 * (merged into the vocabulary) and to the in-memory vocabulary, so the rest
 * of this run already resolves them. Places already present are skipped.
 *
 * @returns The places that were actually added
 */
export function addPlaceTags(places: readonly NewPlace[]): NewPlace[] {
  const file = JSON.parse(
    fs.readFileSync(PLACE_TAGS_PATH, 'utf-8')
  ) as PlaceTagsFile;
  const known = new Set([...COUNTRY_TAGS, ...CITY_TAGS].map((tag) => tag.slug));

  const added = places.filter((place) => {
    if (known.has(place.tag.slug)) return false;
    known.add(place.tag.slug);
    const fileList = place.kind === 'country' ? file.countries : file.cities;
    const vocabulary = place.kind === 'country' ? COUNTRY_TAGS : CITY_TAGS;
    fileList.push(place.tag);
    vocabulary.push(place.tag);
    return true;
  });

  if (added.length > 0) {
    fs.writeFileSync(
      PLACE_TAGS_PATH,
      `${JSON.stringify(file, null, 2)}\n`,
      'utf-8'
    );
  }
  return added;
}
