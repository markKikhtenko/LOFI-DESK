import { ArrowRight, Clock3, Headphones, Library, Radio, Sparkles } from 'lucide-react';
import { StationCard } from '../components/StationCard';
import { TrackTable } from '../components/TrackTable';
import { useAppStore } from '../stores/useAppStore';
import { formatCount } from '../utils/format';

export function HomePage() {
  const setPage = useAppStore((state) => state.setPage);
  const stations = useAppStore((state) => state.stations);
  const tracks = useAppStore((state) => state.tracks);
  const hour = new Date().getHours();
  const greeting = hour < 6 ? 'Тихой ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  return (
    <div className="page home-page">
      <section className="hero-panel">
        <div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" />
        <div className="hero-content">
          <p className="eyebrow"><Sparkles size={14} /> Пространство для концентрации</p>
          <h1>{greeting}.<br /><span>Настроимся на волну?</span></h1>
          <p>Спокойное радио и ваша музыка — без аккаунтов, рекламы и лишнего шума.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => setPage('radio')}><Radio size={17} />Открыть радио</button>
            <button className="secondary-button" onClick={() => setPage('library')}><Library size={17} />Моя музыка</button>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="vinyl"><span /><i /></div>
          <div className="sound-wave">{[22, 36, 58, 42, 69, 51, 31, 48, 24].map((height, index) => <i key={index} style={{ height }} />)}</div>
        </div>
      </section>

      <section className="stats-row">
        <div><span className="stat-icon purple"><Radio size={19} /></span><p><strong>{formatCount(stations.length, 'станция', 'станции', 'станций')}</strong><span>готовы к эфиру</span></p></div>
        <div><span className="stat-icon blue"><Headphones size={19} /></span><p><strong>{formatCount(tracks.length, 'трек', 'трека', 'треков')}</strong><span>в локальной медиатеке</span></p></div>
        <div><span className="stat-icon amber"><Clock3 size={19} /></span><p><strong>Всегда рядом</strong><span>продолжает играть в трее</span></p></div>
      </section>

      <section className="content-section">
        <div className="section-heading"><div><p className="eyebrow">Сейчас в эфире</p><h2>Радиостанции для работы</h2></div><button className="text-button" onClick={() => setPage('radio')}>Все станции <ArrowRight size={16} /></button></div>
        <div className="station-grid home-stations">{stations.slice(0, 3).map((station) => <StationCard station={station} key={station.id} />)}</div>
      </section>

      {tracks.length > 0 && (
        <section className="content-section compact-section">
          <div className="section-heading"><div><p className="eyebrow">Недавно добавлено</p><h2>Из вашей медиатеки</h2></div><button className="text-button" onClick={() => setPage('library')}>Вся музыка <ArrowRight size={16} /></button></div>
          <TrackTable tracks={tracks.slice(0, 5)} />
        </section>
      )}
    </div>
  );
}

