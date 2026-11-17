import { convertFileSrc } from '@tauri-apps/api/core';
import { useEffect, useRef } from 'react';
import { readRadioMetadata, restoreMediaScopes } from '../services/tauri';
import { useAppStore } from '../stores/useAppStore';
import { AUTO_SWITCH_FADE_IN_MS, AUTO_SWITCH_FADE_OUT_MS, smoothFadeProgress } from '../utils/fade';
import { getRadioRetryDelay } from '../utils/radio';
import { sliderToAudioVolume } from '../utils/volume';

const audio = new Audio();
audio.preload = 'metadata';
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let capturedSource: MediaStreamAudioSourceNode | null = null;
const STALLED_STREAM_TIMEOUT_MS = 12_000;

interface ReconnectOptions {
  immediate?: boolean;
  networkRestored?: boolean;
}

type AutoSwitchPhase = 'idle' | 'fading-out' | 'loading-next';

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
  const autoSwitchMinutes = useAppStore((state) => state.autoSwitchMinutes);
  const retryRef = useRef(0);
  const retryTimerRef = useRef<number | undefined>(undefined);
  const stalledTimerRef = useRef<number | undefined>(undefined);
  const stationSourcesRef = useRef<string[]>([]);
  const stationSourceIndexRef = useRef(0);
  const requestReconnectRef = useRef<(options?: ReconnectOptions) => void>(() => undefined);
  const autoSwitchTimerRef = useRef<number | undefined>(undefined);
  const fadeFrameRef = useRef<number | undefined>(undefined);
  const fadeGainRef = useRef(1);
  const autoSwitchPhaseRef = useRef<AutoSwitchPhase>('idle');
  const beginAutoSwitchRef = useRef<() => void>(() => undefined);
  const cancelFadeRef = useRef<(restoreVolume?: boolean) => void>(() => undefined);

  useEffect(() => {
    void restoreMediaScopes(folders).catch(() => undefined);
  }, [folders]);

  useEffect(() => {
    audio.volume = sliderToAudioVolume(volume) * fadeGainRef.current;
    audio.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    const store = useAppStore.getState();
    if (autoSwitchPhaseRef.current === 'fading-out') {
      autoSwitchPhaseRef.current = 'idle';
      cancelFadeRef.current(true);
    } else if (autoSwitchPhaseRef.current !== 'loading-next') {
      cancelFadeRef.current(true);
    }
    window.clearTimeout(retryTimerRef.current);
    retryTimerRef.current = undefined;
    window.clearTimeout(stalledTimerRef.current);
    stalledTimerRef.current = undefined;
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
      const artwork = station?.artwork ?? track?.cover;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: station?.name ?? track!.title,
        artist: station ? `${station.provider ?? 'Интернет-радио'} / интернет-радио` : track!.artist,
        album: station ? 'LOFI DESK' : track!.album,
        artwork: artwork ? [{ src: artwork }] : undefined,
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
          requestReconnectRef.current();
          return;
        }
        state.setPlaybackError(describePlaybackError(error));
        state.setPlaying(false);
      });
    } else {
      autoSwitchPhaseRef.current = 'idle';
      cancelFadeRef.current(true);
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = undefined;
      window.clearTimeout(stalledTimerRef.current);
      stalledTimerRef.current = undefined;
      audio.pause();
    }
  }, [current, isPlaying]);

  useEffect(() => {
    const applyFadeGain = () => {
      const state = useAppStore.getState();
      audio.volume = sliderToAudioVolume(state.volume) * fadeGainRef.current;
      audio.muted = state.muted;
    };
    const cancelFade = (restoreVolume = false) => {
      window.cancelAnimationFrame(fadeFrameRef.current ?? 0);
      fadeFrameRef.current = undefined;
      if (restoreVolume) {
        fadeGainRef.current = 1;
        applyFadeGain();
      }
    };
    const fadeTo = (target: number, duration: number, onComplete?: () => void) => {
      cancelFade();
      const startGain = fadeGainRef.current;
      let startedAt: number | undefined;
      const step = (timestamp: number) => {
        startedAt ??= timestamp;
        const progress = Math.min(1, (timestamp - startedAt) / duration);
        const eased = smoothFadeProgress(progress);
        fadeGainRef.current = startGain + (target - startGain) * eased;
        applyFadeGain();
        if (progress < 1) fadeFrameRef.current = window.requestAnimationFrame(step);
        else {
          fadeFrameRef.current = undefined;
          onComplete?.();
        }
      };
      fadeFrameRef.current = window.requestAnimationFrame(step);
    };
    const beginAutoSwitch = () => {
      const state = useAppStore.getState();
      if (state.current?.kind !== 'station' || !state.isPlaying || autoSwitchPhaseRef.current !== 'idle') return;
      autoSwitchPhaseRef.current = 'fading-out';
      fadeTo(0, AUTO_SWITCH_FADE_OUT_MS, () => {
        const latest = useAppStore.getState();
        if (latest.current?.kind !== 'station' || !latest.isPlaying) {
          autoSwitchPhaseRef.current = 'idle';
          fadeTo(1, AUTO_SWITCH_FADE_IN_MS);
          return;
        }
        autoSwitchPhaseRef.current = 'loading-next';
        latest.skip(1);
      });
    };
    cancelFadeRef.current = cancelFade;
    beginAutoSwitchRef.current = beginAutoSwitch;

    const showRecoveryState = (message: string) => {
      const state = useAppStore.getState();
      state.setPlaybackError(message);
      state.setBuffering(true);
    };
    const clearRetryTimer = () => {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = undefined;
    };
    const clearStalledTimer = () => {
      window.clearTimeout(stalledTimerRef.current);
      stalledTimerRef.current = undefined;
    };
    const scheduleReconnect = (options: ReconnectOptions = {}) => {
      const state = useAppStore.getState();
      if (state.current?.kind !== 'station' || !state.isPlaying || retryTimerRef.current !== undefined) return;

      clearStalledTimer();
      if (!navigator.onLine) {
        showRecoveryState('Нет сети. Эфир продолжится автоматически после подключения.');
        retryTimerRef.current = window.setTimeout(() => {
          retryTimerRef.current = undefined;
          scheduleReconnect();
        }, 5_000);
        return;
      }

      retryRef.current += 1;
      const attempt = retryRef.current;
      const delay = options.immediate ? 0 : getRadioRetryDelay(attempt);
      showRecoveryState(options.networkRestored
        ? 'Сеть вернулась. Восстанавливаем эфир…'
        : delay === 0
          ? 'Восстанавливаем эфир…'
          : `Связь с эфиром потеряна. Повтор через ${Math.ceil(delay / 1_000)} с…`);

      retryTimerRef.current = window.setTimeout(() => {
        retryTimerRef.current = undefined;
        const latest = useAppStore.getState();
        if (latest.current?.kind !== 'station' || !latest.isPlaying) return;
        if (!navigator.onLine) {
          scheduleReconnect();
          return;
        }

        const sources = stationSourcesRef.current;
        if (sources.length > 1) {
          stationSourceIndexRef.current = (stationSourceIndexRef.current + 1) % sources.length;
        }
        const nextSource = sources[stationSourceIndexRef.current];
        if (nextSource) audio.src = nextSource;
        audio.load();
        void audio.play().catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'NotAllowedError') {
            const currentState = useAppStore.getState();
            currentState.setPlaybackError(describePlaybackError(error));
            currentState.setPlaying(false);
            return;
          }
          scheduleReconnect();
        });
      }, delay);
    };
    requestReconnectRef.current = scheduleReconnect;

    const onPlaying = () => {
      connectAudioAnalysis();
      clearRetryTimer();
      clearStalledTimer();
      retryRef.current = 0;
      useAppStore.getState().setBuffering(false);
      useAppStore.getState().setPlaybackError(null);
      if (autoSwitchPhaseRef.current === 'loading-next') {
        autoSwitchPhaseRef.current = 'idle';
        fadeGainRef.current = 0;
        applyFadeGain();
        fadeTo(1, AUTO_SWITCH_FADE_IN_MS);
      }
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    };
    const onWaiting = () => {
      const state = useAppStore.getState();
      state.setBuffering(true);
      if (state.current?.kind !== 'station' || !state.isPlaying || stalledTimerRef.current !== undefined) return;
      stalledTimerRef.current = window.setTimeout(() => {
        stalledTimerRef.current = undefined;
        scheduleReconnect();
      }, STALLED_STREAM_TIMEOUT_MS);
    };
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
      if (state.current?.kind === 'station' && state.isPlaying) scheduleReconnect();
      else {
        state.setPlaybackError('Источник недоступен или формат не поддерживается.');
        state.setPlaying(false);
      }
    };
    const onOffline = () => {
      const state = useAppStore.getState();
      if (state.current?.kind !== 'station' || !state.isPlaying) return;
      clearRetryTimer();
      scheduleReconnect();
    };
    const onOnline = () => {
      const state = useAppStore.getState();
      if (state.current?.kind !== 'station' || !state.isPlaying) return;
      clearRetryTimer();
      scheduleReconnect({ immediate: true, networkRestored: true });
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('stalled', onWaiting);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('durationchange', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

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
      requestReconnectRef.current = () => undefined;
      beginAutoSwitchRef.current = () => undefined;
      cancelFadeRef.current = () => undefined;
      cancelFade(true);
      clearRetryTimer();
      clearStalledTimer();
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('stalled', onWaiting);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('durationchange', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  useEffect(() => {
    window.clearTimeout(autoSwitchTimerRef.current);
    autoSwitchTimerRef.current = undefined;
    if (autoSwitchMinutes === 0 || current?.kind !== 'station' || !isPlaying) return;
    autoSwitchTimerRef.current = window.setTimeout(
      () => beginAutoSwitchRef.current(),
      autoSwitchMinutes * 60_000,
    );
    return () => {
      window.clearTimeout(autoSwitchTimerRef.current);
      autoSwitchTimerRef.current = undefined;
    };
  }, [autoSwitchMinutes, current?.id, current?.kind, isPlaying]);

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
