export function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function formatCount(value: number, one: string, few: string, many: string) {
  const tens = value % 100;
  const units = value % 10;
  if (tens >= 11 && tens <= 19) return `${value} ${many}`;
  if (units === 1) return `${value} ${one}`;
  if (units >= 2 && units <= 4) return `${value} ${few}`;
  return `${value} ${many}`;
}

export function fileName(path: string) {
  return path.split(/[\\/]/).pop() ?? path;
}

