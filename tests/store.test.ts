import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_STATIONS } from '../src/data/stations';
import { useAppStore } from '../src/stores/useAppStore';
import type { Track } from '../src/types';

const track: Track = {
  id: 'track-1',
  path: 'C:\\Music\\track.mp3',
  title: 'Night Walk',
  artist: 'Artist',
  album: 'Album',
  duration: 180,
};

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({
    stations: DEFAULT_STATIONS,
    tracks: [],
    folders: [],
    favoriteTrackIds: [],
    favoriteStationIds: [],
    playlists: [],
    queue: [],
    current: null,
    isPlaying: false,
  });
});

describe('application store', () => {
  it('adds a scanned folder and starts local playback', () => {
    useAppStore.getState().setLibrary('C:\\Music', [track]);
    useAppStore.getState().playTrack(track.id);

    expect(useAppStore.getState().folders).toEqual(['C:\\Music']);
    expect(useAppStore.getState().current).toEqual({ kind: 'track', id: track.id });
    expect(useAppStore.getState().isPlaying).toBe(true);
  });

  it('creates playlists without duplicate tracks', () => {
    const playlistId = useAppStore.getState().createPlaylist('Focus');
    useAppStore.getState().addToPlaylist(playlistId, track.id);
    useAppStore.getState().addToPlaylist(playlistId, track.id);

    expect(useAppStore.getState().playlists[0]?.trackIds).toEqual([track.id]);
  });

  it('switches between radio stations', () => {
    useAppStore.getState().playStation(DEFAULT_STATIONS[0]!.id);
    useAppStore.getState().skip(1);
    expect(useAppStore.getState().current).toEqual({ kind: 'station', id: DEFAULT_STATIONS[1]!.id });
  });
});

