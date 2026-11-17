const RADIO_RETRY_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 15_000, 30_000] as const;

export function getRadioRetryDelay(attempt: number) {
  const index = Math.max(0, Math.floor(attempt) - 1);
  return RADIO_RETRY_DELAYS_MS[Math.min(index, RADIO_RETRY_DELAYS_MS.length - 1)]!;
}
