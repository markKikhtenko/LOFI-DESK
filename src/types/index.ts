export type PageId = 'home' | 'radio' | 'library' | 'playlists' | 'favorites' | 'settings';

export type RepeatMode = 'off' | 'all' | 'one';

export interface Station {
  id: string;
  name: string;
  description: string;
  streamUrl: string;
  streamFallbackUrls?: string[];
  metadataUrl?: string;
  accent: string;
  isBuiltIn: boolean;
}

export interface Track {
  id: string;
  path: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  trackNumber?: number;
  year?: number;
  cover?: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: string;
}

export type PlayingItem =
  | { kind: 'station'; id: string }
  | { kind: 'track'; id: string };

export interface PlaybackSettings {
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
}

export interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'up-to-date' | 'error';
  currentVersion: string;
  availableVersion?: string;
  notes?: string;
  progress: number;
  message?: string;
}

export interface ScannedLibrary {
  folder: string;
  tracks: Track[];
  skipped: number;
}
