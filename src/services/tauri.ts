import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { ScannedLibrary, Track } from '../types';

export const isTauri = () => '__TAURI_INTERNALS__' in window;

export async function chooseAndScanFolder(): Promise<ScannedLibrary | null> {
  if (!isTauri()) throw new Error('Выбор папки доступен в настольном приложении.');
  const folder = await open({ directory: true, multiple: false, title: 'Выберите папку с музыкой' });
  if (!folder) return null;
  await invoke('grant_media_scope', { folder });
  return invoke<ScannedLibrary>('scan_music_folder', { folder });
}

export async function scanFolder(folder: string): Promise<ScannedLibrary> {
  if (!isTauri()) throw new Error('Сканирование доступно в настольном приложении.');
  await invoke('grant_media_scope', { folder });
  return invoke<ScannedLibrary>('scan_music_folder', { folder });
}

export async function restoreMediaScopes(folders: string[]): Promise<void> {
  if (!isTauri()) return;
  await Promise.all(folders.map((folder) => invoke('grant_media_scope', { folder })));
}

export async function readRadioMetadata(url: string): Promise<string | null> {
  if (!isTauri()) return null;
  return invoke<string | null>('fetch_station_metadata', { url });
}

export function mergeScans(scans: ScannedLibrary[]): Track[] {
  const byId = new Map<string, Track>();
  scans.flatMap((scan) => scan.tracks).forEach((track) => byId.set(track.id, track));
  return [...byId.values()].sort((a, b) => `${a.artist}\u0000${a.album}\u0000${a.trackNumber ?? 0}\u0000${a.title}`.localeCompare(
    `${b.artist}\u0000${b.album}\u0000${b.trackNumber ?? 0}\u0000${b.title}`,
    'ru',
  ));
}

