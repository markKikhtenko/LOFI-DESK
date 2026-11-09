const IDLE_LEVEL = 0.08;
const MIN_ACTIVE_PEAK = 1.5;

export function normalizedSpectrumLevel(average: number, framePeak: number) {
  if (framePeak < MIN_ACTIVE_PEAK) return IDLE_LEVEL;
  const relativeLevel = Math.max(0, average) / framePeak;
  return Math.max(IDLE_LEVEL, Math.min(1, relativeLevel ** 0.72));
}

