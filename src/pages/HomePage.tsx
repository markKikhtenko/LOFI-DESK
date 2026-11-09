import { ArrowRight, Headphones, Library, Pause, Play, Radio } from 'lucide-react';
import { AudioSpectrum } from '../components/AudioSpectrum';
import { StationCard } from '../components/StationCard';
import { TrackTable } from '../components/TrackTable';
import { useAppStore } from '../stores/useAppStore';
import { formatCount } from '../utils/format';

export function HomePage() {
  const state = useAppStore();
  const { current, stations, tracks } = state;
  const station = current?.kind === 'station' ? stations.find((item) => item.id === current.id) : undefined;
  const track = current?.kind === 'track' ? tracks.find((item) => item.id === current.id) : undefined;
  const hasMedia = Boolean(station || track);
  const isAudible = hasMedia && state.isPlaying && !state.isBuffering && !state.playbackError;
  const canVisualize = Boolean(track || station?.isBuiltIn);
  const nowTitle = station?.name ?? track?.title ?? 'Ничего не играет';
  const nowSubtitle = station
    ? state.streamTitle ?? 'Прямой радиоэфир'
    : track ? `${track.artist} · ${track.album}` : 'Выберите волну или трек';
  const hour = new Date().getHours();
  const greeting = hour < 6 ? 'Тихой ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  return (
    <div className="page home-page">
      <section className={`hero-panel ${isAudible ? 'is-playing' : ''}`}>
        <div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" />
        <div className="hero-content">
          <p className="eyebrow">Главная</p>
          <h1>{greeting}.<br /><span>Настроимся на волну?</span></h1>
          <p>Радио и музыка из вашей медиатеки.</p>
          <div className="hero-actions">
            {hasMedia ? (
              <button className="primary-button" onClick={() => state.setPlaying(!state.isPlaying)}>
                {state.isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
                {state.isPlaying ? 'Пауза' : 'Продолжить'}
              </button>
            ) : (
              <button className="primary-button" onClick={() => state.setPage('radio')}><Radio size={17} />Выбрать станцию</button>
            )}
            <button className="secondary-button" onClick={() => state.setPage('library')}><Library size={17} />Моя музыка</button>
          </div>
        </div>

        <div className="hero-visual">
          <div className={`vinyl ${isAudible ? 'is-spinning' : ''}`} aria-hidden="true"><span /><i /></div>
          <div className="hero-now-playing">
            <span className={`hero-playback-state ${isAudible ? 'active' : ''}`}>
              <i />{isAudible ? 'Сейчас играет' : hasMedia ? 'На паузе' : 'Тишина'}
            </span>
            <strong>{nowTitle}</strong>
            <small title={nowSubtitle}>{nowSubtitle}</small>
            {isAudible && canVisualize && <AudioSpectrum />}
          </div>
        </div>
      </section>

      <section className="stats-row stats-row-compact">
        <div><span className="stat-icon purple"><Radio size={19} /></span><p><strong>{formatCount(stations.length, 'станция', 'станции', 'станций')}</strong><span>готовы к эфиру</span></p></div>
        <div><span className="stat-icon blue"><Headphones size={19} /></span><p><strong>{formatCount(tracks.length, 'трек', 'трека', 'треков')}</strong><span>в локальной медиатеке</span></p></div>
      </section>

      <section className="content-section">
        <div className="section-heading"><div><p className="eyebrow">Под настроение</p><h2>Лоуфай и чилл для работы</h2></div><button className="text-button" onClick={() => state.setPage('radio')}>Все станции <ArrowRight size={16} /></button></div>
        <div className="station-grid home-stations">{stations.slice(0, 3).map((item) => <StationCard station={item} key={item.id} />)}</div>
      </section>

      {tracks.length > 0 && (
        <section className="content-section compact-section">
          <div className="section-heading"><div><p className="eyebrow">Недавно добавлено</p><h2>Из вашей медиатеки</h2></div><button className="text-button" onClick={() => state.setPage('library')}>Вся музыка <ArrowRight size={16} /></button></div>
          <TrackTable tracks={tracks.slice(0, 5)} />
        </section>
      )}
    </div>
  );
}
