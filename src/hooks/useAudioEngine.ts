import { convertFileSrc } from '@tauri-apps/api/core';
import { useEffect, useRef } from 'react';
import { readRadioMetadata, restoreMediaScopes } from '../services/tauri';
import { useAppStore } from '../stores/useAppStore';

const audio = new Audio();
audio.preload = 'metadata';
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let capturedSource: MediaStreamAudioSourceNode | null = null;

function connectAudioAnalysis() {
  if (!audioContext || !analyser || capturedSource) return;
  const captureStream = (audio as HTMLAudioElement & { captureStream?: () => MediaStream }).captureStream;
  if (!captureStream) return;
  const stream = captureStream.call(audio);
  if (!stream.getAudioTracks().length) return;
  capturedSource = audioContext.createMediaStreamSource(stream);
  capturedSource.connect(analyser);
}

function unlockAudioAnalysis() {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.minDecibels = -88;
      analyser.maxDecibels = -18;
      analyser.smoothingTimeConstant = 0.82;
    }
    if (audioContext.state === 'suspended') void audioContext.resume().catch(() => undefined);
    if (!audio.paused) connectAudioAnalysis();
  } catch {
    // Playback still works without Web Audio on runtimes that do not expose it.
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', unlockAudioAnalysis, { passive: true });
  window.addEventListener('keydown', unlockAudioAnalysis);
}

export function getAudioAnalyser() {
  return analyser;
}

function describePlaybackError(error: unknown) {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Windows заблокировал запуск аудио. Нажмите воспроизведение ещё раз.';
  }
  return error instanceof Error ? error.message : 'Не удалось начать воспроизведение.';
}

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
  const stationSourcesRef = useRef<string[]>([]);
  const stationSourceIndexRef = useRef(0);

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
    retryTimerRef.current = undefined;
    retryRef.current = 0;
    stationSourceIndexRef.current = 0;
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

    if (station?.isBuiltIn) audio.crossOrigin = 'anonymous';
    else audio.removeAttribute('crossorigin');
    const source = station ? station.streamUrl : convertFileSrc(track!.path);
    stationSourcesRef.current = station
      ? [...new Set([station.streamUrl, ...(station.streamFallbackUrls ?? [])])]
      : [];
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

  // The source must only be replaced when the selected item changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.kind, current?.id]);

  useEffect(() => {
    if (!current) return;
    if (isPlaying) {
      void audio.play().catch((error: unknown) => {
        const state = useAppStore.getState();
        if (state.current?.kind === 'station' && !(error instanceof DOMException && error.name === 'NotAllowedError')) {
          // A media error event owns retries and source failover for live streams.
          return;
        }
        state.setPlaybackError(describePlaybackError(error));
        state.setPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [current, isPlaying]);

  useEffect(() => {
    const onPlaying = () => {
      connectAudioAnalysis();
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = undefined;
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
      if (retryTimerRef.current !== undefined) return;
      if (state.current?.kind === 'station' && state.isPlaying && retryRef.current < 4) {
        retryRef.current += 1;
        const sources = stationSourcesRef.current;
        if (sources.length > 1) {
          stationSourceIndexRef.current = (stationSourceIndexRef.current + 1) % sources.length;
        }
        state.setPlaybackError(sources.length > 1
          ? `Поток прерван. Подключаем резервный сервер ${retryRef.current}/4…`
          : `Поток прерван. Повторное подключение ${retryRef.current}/4…`);
        state.setBuffering(true);
        retryTimerRef.current = window.setTimeout(() => {
          retryTimerRef.current = undefined;
          const nextSource = sources[stationSourceIndexRef.current];
          if (nextSource) audio.src = nextSource;
          audio.load();
          void audio.play().catch(() => undefined);
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
      retryTimerRef.current = undefined;
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
