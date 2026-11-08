import { Heart, ListPlus, MoreHorizontal, Pause, Play } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import type { Track } from '../types';
import { formatTime } from '../utils/format';

export function TrackTable({ tracks, removableFromPlaylist }: { tracks: Track[]; removableFromPlaylist?: string }) {
  const current = useAppStore((state) => state.current);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const favoriteIds = useAppStore((state) => state.favoriteTrackIds);
  const playlists = useAppStore((state) => state.playlists);
  const playTrack = useAppStore((state) => state.playTrack);
  const setPlaying = useAppStore((state) => state.setPlaying);
  const toggleFavorite = useAppStore((state) => state.toggleFavoriteTrack);
  const addToPlaylist = useAppStore((state) => state.addToPlaylist);
  const removeFromPlaylist = useAppStore((state) => state.removeFromPlaylist);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const queue = tracks.map((track) => track.id);

  return (
    <div className="track-table" role="table" aria-label="Список композиций">
      <div className="track-row track-head" role="row">
        <span>#</span><span>Название</span><span>Альбом</span><span>Время</span><span />
      </div>
      {tracks.map((track, index) => {
        const active = current?.kind === 'track' && current.id === track.id;
        const favorite = favoriteIds.includes(track.id);
        return (
          <div className={`track-row ${active ? 'active' : ''}`} role="row" key={track.id}>
            <button className="track-index" onClick={() => active ? setPlaying(!isPlaying) : playTrack(track.id, queue)} aria-label={`Воспроизвести ${track.title}`}>
              <span>{index + 1}</span>
              {active && isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
            </button>
            <div className="track-identity">
              <div className="track-cover">
                {track.cover ? <img src={track.cover} alt="" /> : <span>{track.title.slice(0, 1).toUpperCase()}</span>}
              </div>
              <div><strong title={track.title}>{track.title}</strong><span title={track.artist}>{track.artist}</span></div>
            </div>
            <span className="track-album" title={track.album}>{track.album}</span>
            <span className="track-duration">{formatTime(track.duration)}</span>
            <div className="track-tools">
              <button className={`icon-button ${favorite ? 'favorite' : ''}`} onClick={() => toggleFavorite(track.id)} aria-label="Избранное">
                <Heart size={16} fill={favorite ? 'currentColor' : 'none'} />
              </button>
              <div className="card-menu-wrap">
                <button className="icon-button" onClick={() => setOpenMenu(openMenu === track.id ? null : track.id)} aria-label="Действия"><MoreHorizontal size={17} /></button>
                {openMenu === track.id && (
                  <div className="context-menu track-menu">
                    {playlists.length > 0 ? playlists.map((playlist) => (
                      <button key={playlist.id} onClick={() => { addToPlaylist(playlist.id, track.id); setOpenMenu(null); }}>
                        <ListPlus size={15} />{playlist.name}
                      </button>
                    )) : <span className="menu-note">Сначала создайте плейлист</span>}
                    {removableFromPlaylist && (
                      <button className="danger" onClick={() => removeFromPlaylist(removableFromPlaylist, track.id)}>Убрать из плейлиста</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

