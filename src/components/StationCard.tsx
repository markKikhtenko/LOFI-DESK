import { Edit3, Heart, MoreHorizontal, Pause, Play, RadioTower, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import type { Station } from '../types';

export function StationCard({ station, onEdit }: { station: Station; onEdit?: (station: Station) => void }) {
  const [menu, setMenu] = useState(false);
  const current = useAppStore((state) => state.current);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const favorite = useAppStore((state) => state.favoriteStationIds.includes(station.id));
  const playStation = useAppStore((state) => state.playStation);
  const setPlaying = useAppStore((state) => state.setPlaying);
  const toggleFavorite = useAppStore((state) => state.toggleFavoriteStation);
  const removeStation = useAppStore((state) => state.removeStation);
  const active = current?.kind === 'station' && current.id === station.id;

  return (
    <article className={`station-card ${active ? 'playing' : ''}`} style={{ '--station-accent': station.accent } as React.CSSProperties}>
      <div className="station-art">
        <span className="station-orbit" />
        <RadioTower size={30} />
        {active && <span className="live-pill">{isPlaying ? 'В ЭФИРЕ' : 'ПАУЗА'}</span>}
      </div>
      <div className="station-card-body">
        <div className="station-title-row">
          <div><h3>{station.name}</h3><span className="station-format">MP3 · 128 kbps</span></div>
          <div className="card-menu-wrap">
            <button className="icon-button" onClick={() => setMenu((value) => !value)} aria-label="Действия со станцией"><MoreHorizontal size={19} /></button>
            {menu && (
              <div className="context-menu">
                <button onClick={() => { toggleFavorite(station.id); setMenu(false); }}><Heart size={15} />{favorite ? 'Убрать из избранного' : 'В избранное'}</button>
                {!station.isBuiltIn && onEdit && <button onClick={() => { onEdit(station); setMenu(false); }}><Edit3 size={15} />Редактировать</button>}
                {!station.isBuiltIn && <button className="danger" onClick={() => removeStation(station.id)}><Trash2 size={15} />Удалить</button>}
              </div>
            )}
          </div>
        </div>
        <p>{station.description}</p>
        <div className="station-actions">
          <button className="play-card-button" onClick={() => active ? setPlaying(!isPlaying) : playStation(station.id)}>
            {active && isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
            {active && isPlaying ? 'Пауза' : 'Слушать'}
          </button>
          <button className={`heart-button ${favorite ? 'active' : ''}`} onClick={() => toggleFavorite(station.id)} aria-label="Добавить в избранное">
            <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  );
}

