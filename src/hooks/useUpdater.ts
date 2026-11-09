import { getVersion } from '@tauri-apps/api/app';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isTauri } from '../services/tauri';
import type { UpdateState } from '../types';

const initialState: UpdateState = {
  status: 'idle',
  currentVersion: '0.1.1',
  progress: 0,
};

export function useUpdater(autoCheck = false) {
  const [state, setState] = useState<UpdateState>(initialState);
  const updateRef = useRef<Update | null>(null);

  useEffect(() => {
    if (!isTauri()) return;
    void getVersion().then((currentVersion) => setState((value) => ({ ...value, currentVersion })));
    return () => {
      void updateRef.current?.close();
    };
  }, []);

  const checkForUpdates = useCallback(async (silent = false) => {
    if (!isTauri()) {
      setState((value) => ({ ...value, status: 'error', message: 'Проверка обновлений доступна в установленном приложении.' }));
      return;
    }
    setState((value) => ({ ...value, status: 'checking', message: silent ? undefined : 'Проверяем GitHub Releases…', progress: 0 }));
    try {
      await updateRef.current?.close();
      const update = await check();
      updateRef.current = update;
      if (!update) {
        setState((value) => ({ ...value, status: 'up-to-date', message: 'Установлена актуальная версия.' }));
        return;
      }
      setState((value) => ({
        ...value,
        status: 'available',
        availableVersion: update.version,
        notes: update.body ?? 'Описание выпуска отсутствует.',
        message: `Доступна версия ${update.version}`,
      }));
    } catch (error) {
      setState((value) => ({
        ...value,
        status: 'error',
        message: error instanceof Error ? error.message : 'Не удалось проверить обновления.',
      }));
    }
  }, []);

  useEffect(() => {
    if (!autoCheck) return;
    const timer = window.setTimeout(() => void checkForUpdates(true), 2_500);
    return () => window.clearTimeout(timer);
  }, [autoCheck, checkForUpdates]);

  const installUpdate = useCallback(async () => {
    const update = updateRef.current;
    if (!update) return;
    let downloaded = 0;
    let total = 0;
    setState((value) => ({ ...value, status: 'downloading', progress: 0, message: 'Загрузка обновления…' }));
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') total = event.data.contentLength ?? 0;
        if (event.event === 'Progress') downloaded += event.data.chunkLength;
        if (event.event === 'Finished') downloaded = total || downloaded;
        setState((value) => ({
          ...value,
          progress: total > 0 ? Math.round((downloaded / total) * 100) : value.progress,
          message: event.event === 'Finished' ? 'Проверка подписи и установка…' : 'Загрузка обновления…',
        }));
      });
      setState((value) => ({ ...value, status: 'ready', progress: 100, message: 'Установщик обновления запущен.' }));
    } catch (error) {
      setState((value) => ({
        ...value,
        status: 'error',
        message: error instanceof Error ? error.message : 'Не удалось установить обновление.',
      }));
    }
  }, []);

  return { state, checkForUpdates, installUpdate };
}
