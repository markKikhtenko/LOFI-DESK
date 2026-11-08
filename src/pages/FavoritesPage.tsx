import { Heart } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StationCard } from '../components/StationCard';
import { TrackTable } from '../components/TrackTable';
import { useAppStore } from '../stores/useAppStore';

export function FavoritesPage() {
  const stations = useAppStore((state) => state.stations.filter((station) => state.favoriteStationIds.includes(station.id)));
  const tracks = useAppStore((state) => state.tracks.filter((track) => state.favoriteTrackIds.includes(track.id)));
  return (
    <div className="page">
      <PageHeader eyebrow="Всегда под рукой" title="Избранное" description="Сохранённые радиостанции и композиции в одном месте." />
      {!stations.length && !tracks.length ? <EmptyState icon={Heart} title="Здесь пока тихо" description="Нажимайте на сердце рядом со станцией или композицией — она появится в этом разделе." /> : (
        <>
          {stations.length > 0 && <section className="content-section first-section"><div className="section-heading"><h2>Радиостанции</h2></div><div className="station-grid">{stations.map((station) => <StationCard station={station} key={station.id} />)}</div></section>}
          {tracks.length > 0 && <section className="content-section"><div className="section-heading"><h2>Композиции</h2></div><TrackTable tracks={tracks} /></section>}
        </>
      )}
    </div>
  );
}

