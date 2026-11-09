import { describe, expect, it } from 'vitest';
import { normalizedSpectrumLevel } from '../src/utils/spectrum';

describe('spectrum normalization', () => {
  it('keeps the spectrum shape at low signal levels', () => {
    expect(normalizedSpectrumLevel(4, 8)).toBeCloseTo(normalizedSpectrumLevel(40, 80), 6);
    expect(normalizedSpectrumLevel(8, 8)).toBe(1);
  });

  it('keeps silent input at the idle baseline', () => {
    expect(normalizedSpectrumLevel(0, 0)).toBe(0.08);
  });
});
