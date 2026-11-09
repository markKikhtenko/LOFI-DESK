import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_STATIONS } from '../data/stations';
import type { PageId, Playlist, PlayingItem, RepeatMode, Station, Track } from '../types';

interface AppState {
  page: PageId;
  stations: Station[];
  favoriteStationIds: string[];
  folders: string[];
  tracks: Track[];
  favoriteTrackIds: string[];
  playlists: Playlist[];
  queue: string[];
  current: PlayingItem | null;
  isPlaying: boolean;
  isBuffering: boolean;
  playbackError: string | null;
  streamTitle: string | null;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  position: number;
  duration: number;
  glowEnabled: boolean;
  setPage: (page: PageId) => void;
  addStation: (station: Station) => void;
  updateStation: (station: Station) => void;
  removeStation: (id: string) => void;
  toggleFavoriteStation: (id: string) => void;
  setLibrary: (folder: string, tracks: Track[]) => void;
  replaceTracks: (tracks: Track[]) => void;
  removeFolder: (folder: string) => void;
  toggleFavoriteTrack: (id: string) => void;
  createPlaylist: (name: string) => string;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, trackId: string) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  playStation: (id: string) => void;
  playTrack: (id: string, queue?: string[]) => void;
  setPlaying: (value: boolean) => void;
  setBuffering: (value: boolean) => void;
  setPlaybackError: (value: string | null) => void;
  setStreamTitle: (value: string | null) => void;
  setVolume: (value: number) => void;
  setMuted: (value: boolean) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setProgress: (position: number, duration: number) => void;
  setGlowEnabled: (value: boolean) => void;
  skip: (direction: 1 | -1) => void;
  stop: () => void;
}

const unique = <T,>(items: T[]) => [...new Set(items)];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      page: 'home',
      stations: DEFAULT_STATIONS,
      favoriteStationIds: [],
      folders: [],
      tracks: [],
      favoriteTrackIds: [],
      playlists: [],
      queue: [],
      current: null,
      isPlaying: false,
      isBuffering: false,
      playbackError: null,
      streamTitle: null,
      volume: 0.72,
      muted: false,
      shuffle: false,
      repeat: 'off',
      position: 0,
      duration: 0,
      glowEnabled: false,
      setPage: (page) => set({ page }),
      addStation: (station) => set((state) => ({ stations: [...state.stations, station] })),
      updateStation: (station) => set((state) => ({
        stations: state.stations.map((item) => item.id === station.id ? station : item),
      })),
      removeStation: (id) => set((state) => ({
        stations: state.stations.filter((item) => item.id !== id || item.isBuiltIn),
        favoriteStationIds: state.favoriteStationIds.filter((item) => item !== id),
        current: state.current?.kind === 'station' && state.current.id === id ? null : state.current,
      })),
      toggleFavoriteStation: (id) => set((state) => ({
        favoriteStationIds: state.favoriteStationIds.includes(id)
          ? state.favoriteStationIds.filter((item) => item !== id)
          : [...state.favoriteStationIds, id],
      })),
      setLibrary: (folder, tracks) => set((state) => {
        const otherTracks = state.tracks.filter((track) => !track.path.toLocaleLowerCase().startsWith(folder.toLocaleLowerCase()));
        return { folders: unique([...state.folders, folder]), tracks: [...otherTracks, ...tracks] };
      }),
      replaceTracks: (tracks) => set({ tracks }),
      removeFolder: (folder) => set((state) => {
        const kept = state.tracks.filter((track) => !track.path.toLocaleLowerCase().startsWith(folder.toLocaleLowerCase()));
        const keptIds = new Set(kept.map((track) => track.id));
        return {
          folders: state.folders.filter((item) => item !== folder),
          tracks: kept,
          favoriteTrackIds: state.favoriteTrackIds.filter((id) => keptIds.has(id)),
          queue: state.queue.filter((id) => keptIds.has(id)),
        };
      }),
      toggleFavoriteTrack: (id) => set((state) => ({
        favoriteTrackIds: state.favoriteTrackIds.includes(id)
          ? state.favoriteTrackIds.filter((item) => item !== id)
          : [...state.favoriteTrackIds, id],
      })),
      createPlaylist: (name) => {
        const id = crypto.randomUUID();
        set((state) => ({ playlists: [...state.playlists, { id, name, trackIds: [], createdAt: new Date().toISOString() }] }));
        return id;
      },
      deletePlaylist: (id) => set((state) => ({ playlists: state.playlists.filter((item) => item.id !== id) })),
      addToPlaylist: (playlistId, trackId) => set((state) => ({
        playlists: state.playlists.map((item) => item.id === playlistId
          ? { ...item, trackIds: unique([...item.trackIds, trackId]) }
          : item),
      })),
      removeFromPlaylist: (playlistId, trackId) => set((state) => ({
        playlists: state.playlists.map((item) => item.id === playlistId
          ? { ...item, trackIds: item.trackIds.filter((id) => id !== trackId) }
          : item),
      })),
      playStation: (id) => set({
        current: { kind: 'station', id }, isPlaying: true, isBuffering: true,
        playbackError: null, streamTitle: null, position: 0, duration: 0,
      }),
      playTrack: (id, queue) => set((state) => ({
        current: { kind: 'track', id }, isPlaying: true, isBuffering: true,
        playbackError: null, position: 0,
        queue: queue?.length ? queue : state.queue.includes(id) ? state.queue : state.tracks.map((track) => track.id),
      })),
      setPlaying: (value) => set({ isPlaying: value }),
      setBuffering: (value) => set({ isBuffering: value }),
      setPlaybackError: (value) => set({ playbackError: value, isBuffering: false }),
      setStreamTitle: (value) => set({ streamTitle: value }),
      setVolume: (value) => set({ volume: Math.max(0, Math.min(1, value)), muted: value === 0 }),
      setMuted: (value) => set({ muted: value }),
      toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
      cycleRepeat: () => set((state) => ({ repeat: state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off' })),
      setProgress: (position, duration) => set({ position, duration }),
      setGlowEnabled: (value) => set({ glowEnabled: value }),
      skip: (direction) => set((state) => {
        if (!state.current) return state;
        if (state.current.kind === 'station') {
          const index = state.stations.findIndex((item) => item.id === state.current?.id);
          const next = state.stations[(index + direction + state.stations.length) % state.stations.length];
          return next ? { current: { kind: 'station', id: next.id }, isPlaying: true, isBuffering: true, streamTitle: null } : state;
        }
        const queue = state.queue.length ? state.queue : state.tracks.map((track) => track.id);
        if (!queue.length) return state;
        const index = queue.indexOf(state.current.id);
        const randomIndex = Math.floor(Math.random() * queue.length);
        let nextIndex = state.shuffle ? randomIndex : index + direction;
        if (nextIndex < 0) nextIndex = state.repeat === 'all' ? queue.length - 1 : 0;
        if (nextIndex >= queue.length) nextIndex = state.repeat === 'all' ? 0 : queue.length - 1;
        return { current: { kind: 'track', id: queue[nextIndex]! }, isPlaying: true, isBuffering: true, position: 0 };
      }),
      stop: () => set({ isPlaying: false, current: null, position: 0, duration: 0, isBuffering: false, streamTitle: null }),
    }),
    {
      name: 'lofi-desk-state-v1',
      partialize: (state) => ({
        stations: state.stations,
        favoriteStationIds: state.favoriteStationIds,
        folders: state.folders,
        tracks: state.tracks,
        favoriteTrackIds: state.favoriteTrackIds,
        playlists: state.playlists,
        queue: state.queue,
        current: state.current,
        volume: state.volume,
        muted: state.muted,
        shuffle: state.shuffle,
        repeat: state.repeat,
        glowEnabled: state.glowEnabled,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<AppState>;
        const savedCustom = saved.stations?.filter((station) => !station.isBuiltIn) ?? [];
        return {
          ...current,
          ...saved,
          stations: [...DEFAULT_STATIONS, ...savedCustom],
          isPlaying: false,
          isBuffering: false,
          playbackError: null,
        };
      },
    },
  ),
);
