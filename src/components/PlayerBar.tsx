import {
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  RotateCcw,
  Shuffle,
  SkipBack,
  SkipForward,
  Square,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { seekTo } from '../hooks/useAudioEngine';
import { useAppStore } from '../stores/useAppStore';
import { formatTime } from '../utils/format';

export function PlayerBar() {
  const state = useAppStore();
  const station = state.current?.kind === 'station' ? state.stations.find((item) => item.id === state.current?.id) : undefined;
  const track = state.current?.kind === 'track' ? state.tracks.find((item) => item.id === state.current?.id) : undefined;
  const isRadio = state.current?.kind === 'station';
  const title = station?.name ?? track?.title ?? 'Ничего не играет';
  const subtitle = station ? state.streamTitle ?? 'Подключитесь к радиостанции' : track ? `${track.artist} · ${track.album}` : 'Выберите станцию или композицию';
  const favorite = station
    ? state.favoriteStationIds.includes(station.id)
    : track ? state.favoriteTrackIds.includes(track.id) : false;
  const VolumeIcon = state.muted || state.volume === 0 ? VolumeX : state.volume < 0.5 ? Volume1 : Volume2;

  return (
    <footer className={`player-bar ${state.current ? 'has-media' : ''}`}>
      <div className="now-playing">
        <div className="now-art" style={station ? { background: `linear-gradient(145deg, ${station.accent}, #28233a)` } : undefined}>
          {track?.cover ? <img src={track.cover} alt="" /> : isRadio ? <RotateCcw size={23} className={state.isPlaying && !state.isBuffering ? 'spin-slow' : ''} /> : <ListMusic size={21} />}
        </div>
        <div className="now-copy"><strong>{title}</strong><span title={subtitle}>{subtitle}</span></div>
        <button
          className={`icon-button now-favorite ${favorite ? 'favorite' : ''}`}
          disabled={!state.current}
          onClick={() => station ? state.toggleFavoriteStation(station.id) : track && state.toggleFavoriteTrack(track.id)}
          aria-label="Избранное"
        ><Heart size={17} fill={favorite ? 'currentColor' : 'none'} /></button>
      </div>

      <div className="transport">
        <div className="transport-buttons">
          <button className={`icon-button ${state.shuffle ? 'active' : ''}`} disabled={isRadio || !state.current} onClick={state.toggleShuffle} aria-label="Случайный порядок"><Shuffle size={17} /></button>
          <button className="icon-button" disabled={!state.current} onClick={() => state.skip(-1)} aria-label="Предыдущая"><SkipBack size={19} fill="currentColor" /></button>
          <button className="main-play" disabled={!state.current} onClick={() => state.setPlaying(!state.isPlaying)} aria-label={state.isPlaying ? 'Пауза' : 'Воспроизвести'}>
            {state.isBuffering ? <span className="button-loader" /> : state.isPlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
          </button>
          <button className="icon-button" disabled={!state.current} onClick={() => state.skip(1)} aria-label="Следующая"><SkipForward size={19} fill="currentColor" /></button>
          <button className={`icon-button ${state.repeat !== 'off' ? 'active' : ''}`} disabled={isRadio || !state.current} onClick={state.cycleRepeat} aria-label="Повтор">
            {state.repeat === 'one' ? <Repeat1 size={17} /> : <Repeat size={17} />}
          </button>
        </div>
        <div className={`progress-row ${isRadio ? 'is-live' : ''}`}>
          <span>{isRadio ? 'LIVE' : formatTime(state.position)}</span>
          <input
            aria-label="Позиция воспроизведения"
            type="range"
            min="0"
            max={state.duration || 1}
            step="0.1"
            value={Math.min(state.position, state.duration || 1)}
            disabled={isRadio || !track}
            onChange={(event) => seekTo(Number(event.target.value))}
            style={{ '--range-progress': `${state.duration ? (state.position / state.duration) * 100 : 0}%` } as React.CSSProperties}
          />
          <span>{isRadio ? 'ON AIR' : formatTime(state.duration)}</span>
        </div>
        {state.playbackError && <div className="player-error" title={state.playbackError}>{state.playbackError}</div>}
      </div>

      <div className="volume-controls">
        <button className="icon-button" disabled={!state.current} onClick={state.stop} aria-label="Остановить"><Square size={14} fill="currentColor" /></button>
        <button className="icon-button" onClick={() => state.setMuted(!state.muted)} aria-label="Выключить звук"><VolumeIcon size={18} /></button>
        <input
          aria-label="Громкость"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={state.muted ? 0 : state.volume}
          onChange={(event) => state.setVolume(Number(event.target.value))}
          style={{ '--range-progress': `${(state.muted ? 0 : state.volume) * 100}%` } as React.CSSProperties}
        />
        <span className="volume-value">{Math.round((state.muted ? 0 : state.volume) * 100)}</span>
      </div>
    </footer>
  );
}
