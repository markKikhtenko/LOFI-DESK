import { describe, expect, it } from 'vitest';
import { formatCount, formatTime } from '../src/utils/format';

describe('formatTime', () => {
  it('formats seconds as a player timestamp', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(185.9)).toBe('3:05');
  });

  it('handles invalid values safely', () => {
    expect(formatTime(Number.NaN)).toBe('0:00');
  });
});

describe('formatCount', () => {
  it('uses Russian plural forms', () => {
    expect(formatCount(1, 'трек', 'трека', 'треков')).toBe('1 трек');
    expect(formatCount(3, 'трек', 'трека', 'треков')).toBe('3 трека');
    expect(formatCount(12, 'трек', 'трека', 'треков')).toBe('12 треков');
  });
});

