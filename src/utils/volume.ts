export const QUIET_VOLUME_THRESHOLD = 0.4;
export const VOLUME_CURVE_EXPONENT = 2.2;

export function sliderToAudioVolume(value: number) {
  const normalized = Math.max(0, Math.min(1, value));
  return normalized ** VOLUME_CURVE_EXPONENT;
}
