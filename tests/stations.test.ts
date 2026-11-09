import { describe, expect, it } from 'vitest';
import { DEFAULT_STATIONS } from '../src/data/stations';

describe('built-in radio catalog', () => {
  it('contains a varied lofi and chill selection', () => {
    expect(DEFAULT_STATIONS.map((station) => station.name)).toEqual([
      'Groove Salad',
      'Beat Blender',
      'Vaporwaves',
      'Groove Salad 2',
      'Lush',
      'Drone Zone',
      'Groove Salad Classic',
    ]);
  });

  it('provides distinct HTTPS fallback servers for every built-in station', () => {
    for (const station of DEFAULT_STATIONS) {
      const sources = [station.streamUrl, ...(station.streamFallbackUrls ?? [])];
      expect(sources).toHaveLength(3);
      expect(new Set(sources).size).toBe(3);
      expect(sources.every((source) => source.startsWith('https://ice'))).toBe(true);
      expect(station.metadataUrl).toMatch(/^https:\/\/somafm\.com\/songs\/.+\.json$/);
    }
  });
});
