import { describe, expect, it } from 'vitest';
import { getRadioRetryDelay } from '../src/utils/radio';
import { sliderToAudioVolume } from '../src/utils/volume';
import { smoothFadeProgress } from '../src/utils/fade';

describe('quiet volume curve', () => {
  it('gives the lower half of the slider extra precision', () => {
    expect(sliderToAudioVolume(0)).toBe(0);
    expect(sliderToAudioVolume(0.1)).toBeLessThan(0.01);
    expect(sliderToAudioVolume(0.25)).toBeLessThan(0.05);
    expect(sliderToAudioVolume(0.5)).toBeLessThan(0.25);
    expect(sliderToAudioVolume(1)).toBe(1);
  });

  it('clamps values to the audio element range', () => {
    expect(sliderToAudioVolume(-1)).toBe(0);
    expect(sliderToAudioVolume(2)).toBe(1);
  });
});

describe('radio reconnect backoff', () => {
  it('backs off quickly and caps retries at thirty seconds', () => {
    expect([1, 2, 3, 4, 5, 6, 12].map(getRadioRetryDelay)).toEqual([
      1_000, 2_000, 4_000, 8_000, 15_000, 30_000, 30_000,
    ]);
  });
});

describe('station crossfade curve', () => {
  it('eases cleanly between silence and the selected volume', () => {
    expect(smoothFadeProgress(-1)).toBe(0);
    expect(smoothFadeProgress(0.5)).toBe(0.5);
    expect(smoothFadeProgress(2)).toBe(1);
  });
});
