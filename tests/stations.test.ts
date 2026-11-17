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
      'Secret Agent',
      'Deep Space One',
      'Space Station Soma',
      'Synphaera Radio',
      'Illinois Street Lounge',
      'DEF CON Radio',
      'Fluid',
      'Cliqhop IDM',
      'Drone Zone 2',
      'The Dark Zone',
      'n5MD Radio',
      'C418 Radio',
    ]);
  });

  it('groups stations into useful listening categories', () => {
    expect(DEFAULT_STATIONS.filter((station) => station.category === 'downtempo')).toHaveLength(8);
    expect(DEFAULT_STATIONS.filter((station) => station.category === 'ambient')).toHaveLength(8);
    expect(DEFAULT_STATIONS.filter((station) => station.category === 'chillout')).toHaveLength(3);
  });

  it('provides distinct HTTPS fallback servers for every built-in station', () => {
    for (const station of DEFAULT_STATIONS) {
      const sources = [station.streamUrl, ...(station.streamFallbackUrls ?? [])];
      expect(sources.length).toBeGreaterThanOrEqual(2);
      expect(new Set(sources).size).toBe(sources.length);
      expect(sources.every((source) => source.startsWith('https://'))).toBe(true);
      if (station.provider === 'SomaFM') {
        expect(sources).toHaveLength(3);
        expect(sources.every((source) => source.startsWith('https://ice'))).toBe(true);
        expect(station.metadataUrl).toMatch(/^https:\/\/somafm\.com\/songs\/.+\.json$/);
      } else {
        expect(station.provider).toBe('laut.fm');
        expect(station.metadataUrl).toBe('https://api.laut.fm/station/c418-radio/current_song');
      }
    }
  });

  it('ships local preview artwork for every built-in station', () => {
    for (const station of DEFAULT_STATIONS) {
      expect(station.artwork).toMatch(/\.webp$/);
    }
  });

  it('marks C418 Radio for its animated biome visual', () => {
    expect(DEFAULT_STATIONS.find((station) => station.id === 'laut-c418-radio')?.visual).toBe('biomes');
  });
});
