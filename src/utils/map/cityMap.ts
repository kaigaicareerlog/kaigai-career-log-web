import { geoAlbers, geoNaturalEarth1, geoPath } from 'd3-geo';
import type { GeoProjection } from 'd3-geo';
import { feature } from 'topojson-client';
import landTopology from 'world-atlas/land-110m.json';

/** The map is drawn at build time; these are SVG viewBox units. */
export const MAP_WIDTH = 680;
export const MAP_HEIGHT = 360;

export type MapView = 'world' | 'north-america';

export interface MapPoint {
  id: string;
  lat: number;
  lon: number;
}

export interface PlacedPoint {
  id: string;
  x: number;
  y: number;
}

// Longitudes east of this are Europe/Asia, not part of the North America view
const NORTH_AMERICA_MAX_LON = -50;

// The North America view always covers at least this area, so a single pin
// (or two close ones) doesn't zoom the map in absurdly far
const NORTH_AMERICA_ANCHORS: Array<[number, number]> = [
  [-128, 30],
  [-68, 53],
];

const land = feature(landTopology as any, (landTopology as any).objects.land);

const inNorthAmerica = (point: MapPoint) => point.lon < NORTH_AMERICA_MAX_LON;

function createProjection(view: MapView, points: MapPoint[]): GeoProjection {
  if (view === 'world') {
    return geoNaturalEarth1().fitExtent(
      [
        [6, 6],
        [MAP_WIDTH - 6, MAP_HEIGHT - 6],
      ],
      { type: 'Sphere' } as any
    );
  }

  const coordinates = [
    ...points
      .filter(inNorthAmerica)
      .map((p): [number, number] => [p.lon, p.lat]),
    ...NORTH_AMERICA_ANCHORS,
  ];
  return geoAlbers().fitExtent(
    [
      [40, 30],
      [MAP_WIDTH - 40, MAP_HEIGHT - 30],
    ],
    { type: 'MultiPoint', coordinates } as any
  );
}

/**
 * Pixel positions of the points in the given view. The North America view
 * leaves out points in other parts of the world.
 */
export function placePoints(view: MapView, points: MapPoint[]): PlacedPoint[] {
  const projection = createProjection(view, points);
  const visible = view === 'world' ? points : points.filter(inNorthAmerica);

  return visible.map((point) => {
    const [x, y] = projection([point.lon, point.lat]) as [number, number];
    return {
      id: point.id,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
    };
  });
}

/** SVG path data for the land, clipped to the map's frame */
export function getLandPath(view: MapView, points: MapPoint[]): string {
  const projection = createProjection(view, points).clipExtent([
    [0, 0],
    [MAP_WIDTH, MAP_HEIGHT],
  ]);
  return geoPath(projection).digits(1)(land as any) ?? '';
}
