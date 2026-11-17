export const AUTO_SWITCH_FADE_OUT_MS = 2_400;
export const AUTO_SWITCH_FADE_IN_MS = 3_000;

export function smoothFadeProgress(progress: number) {
  const normalized = Math.max(0, Math.min(1, progress));
  return normalized * normalized * (3 - 2 * normalized);
}
