import { convertFileSrc } from '@tauri-apps/api/core';
import { useEffect, useRef } from 'react';
import { readRadioMetadata, restoreMediaScopes } from '../services/tauri';
import { useAppStore } from '../stores/useAppStore';

const audio = new Audio();
audio.preload = 'metadata';

export function seekTo(seconds: number) {
  if (Number.isFinite(audio.duration)) audio.currentTime = Math.max(0, Math.min(seconds, audio.duration));
}

export function useAudioEngine() {
  const current = useAppStore((state) => state.current);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const volume = useAppStore((state) => state.volume);
  const muted = useAppStore((state) => state.muted);
  const stations = useAppStore((state) => state.stations);
  const tracks = useAppStore((state) => state.tracks);
  const folders = useAppStore((state) => state.folders);
  const retryRef = useRef(0);
  const retryTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    void restoreMediaScopes(folders).catch(() => undefined);
  }, [folders]);

  useEffect(() => {
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    const store = useAppStore.getState();
    window.clearTimeout(retryTimerRef.current);
    retryRef.current = 0;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();

    if (!current) return;
    const station = current.kind === 'station' ? stations.find((item) => item.id === current.id) : undefined;
    const track = current.kind === 'track' ? tracks.find((item) => item.id === current.id) : undefined;
    if (!station && !track) {
      store.setPlaybackError('Источник больше не найден.');
      store.setPlaying(false);
      return;
    }

    const source = station ? station.streamUrl : convertFileSrc(track!.path);
    audio.src = source;
    audio.load();

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: station?.name ?? track!.title,
        artist: station ? 'SomaFM / интернет-радио' : track!.artist,
        album: station ? 'LOFI DESK' : track!.album,
        artwork: track?.cover ? [{ src: track.cover }] : undefined,
      });
    }

    if (isPlaying) {
      void audio.play().catch((error: unknown) => {
        store.setPlaybackError(error instanceof Error ? error.message : 'Не удалось начать воспроизведение.');
        store.setPlaying(false);
      });
    }
  // The source must only be replaced when the selected item changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.kind, current?.id]);

  useEffect(() => {
    if (!current) return;
    if (isPlaying) {
      void audio.play().catch((error: unknown) => {
        useAppStore.getState().setPlaybackError(error instanceof Error ? error.message : 'Не удалось начать воспроизведение.');
        useAppStore.getState().setPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [current, isPlaying]);

  useEffect(() => {
    const onPlaying = () => {
      retryRef.current = 0;
      useAppStore.getState().setBuffering(false);
      useAppStore.getState().setPlaybackError(null);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    };
    const onWaiting = () => useAppStore.getState().setBuffering(true);
    const onPause = () => {
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    };
    const onTime = () => useAppStore.getState().setProgress(audio.currentTime || 0, Number.isFinite(audio.duration) ? audio.duration : 0);
    const onEnded = () => {
      const state = useAppStore.getState();
      if (state.current?.kind === 'track' && state.repeat === 'one') {
        audio.currentTime = 0;
        void audio.play();
      } else {
        state.skip(1);
      }
    };
    const onError = () => {
      const state = useAppStore.getState();
      if (state.current?.kind === 'station' && state.isPlaying && retryRef.current < 4) {
        retryRef.current += 1;
        state.setBuffering(true);
        state.setPlaybackError(`Поток прерван. Повторное подключение ${retryRef.current}/4…`);
        retryTimerRef.current = window.setTimeout(() => {
          audio.load();
          void audio.play();
        }, Math.min(12_000, retryRef.current * 2_000));
      } else {
        state.setPlaybackError('Источник недоступен или формат не поддерживается.');
        state.setPlaying(false);
      }
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('stalled', onWaiting);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('durationchange', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    if ('mediaSession' in navigator) {
      const state = () => useAppStore.getState();
      navigator.mediaSession.setActionHandler('play', () => state().setPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => state().setPlaying(false));
      navigator.mediaSession.setActionHandler('stop', () => state().stop());
      navigator.mediaSession.setActionHandler('previoustrack', () => state().skip(-1));
      navigator.mediaSession.setActionHandler('nexttrack', () => state().skip(1));
      navigator.mediaSession.setActionHandler('seekto', (details) => details.seekTime !== undefined && seekTo(details.seekTime));
    }

    return () => {
      window.clearTimeout(retryTimerRef.current);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('stalled', onWaiting);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('durationchange', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []);

  useEffect(() => {
    if (current?.kind !== 'station') return;
    const station = stations.find((item) => item.id === current.id);
    if (!station?.metadataUrl) return;
    let active = true;
    const refresh = async () => {
      const title = await readRadioMetadata(station.metadataUrl!).catch(() => null);
      if (active && title) useAppStore.getState().setStreamTitle(title);
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [current, stations]);
}
