import { ArrowLeft, ListMusic, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { TrackTable } from '../components/TrackTable';
import { useAppStore } from '../stores/useAppStore';
import { formatCount } from '../utils/format';

export function PlaylistsPage() {
  const playlists = useAppStore((state) => state.playlists);
  const tracks = useAppStore((state) => state.tracks);
  const createPlaylist = useAppStore((state) => state.createPlaylist);
  const deletePlaylist = useAppStore((state) => state.deletePlaylist);
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = playlists.find((playlist) => playlist.id === selectedId);
  const selectedTracks = useMemo(() => selected?.trackIds.map((id) => tracks.find((track) => track.id === id)).filter((track) => track !== undefined) ?? [], [selected, tracks]);

  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get('name') ?? '').trim();
    if (!name) return;
    const id = createPlaylist(name);
    setSelectedId(id);
    setCreating(false);
  };

  if (selected) {
    return (
      <div className="page">
        <button className="back-button" onClick={() => setSelectedId(null)}><ArrowLeft size={16} />Все плейлисты</button>
        <PageHeader eyebrow="Плейлист" title={selected.name} description={formatCount(selectedTracks.length, 'композиция', 'композиции', 'композиций')} actions={<button className="danger-button" onClick={() => { deletePlaylist(selected.id); setSelectedId(null); }}><Trash2 size={16} />Удалить</button>} />
        {selectedTracks.length > 0
          ? <TrackTable tracks={selectedTracks} removableFromPlaylist={selected.id} />
          : <EmptyState icon={ListMusic} title="Плейлист пока пуст" description="Откройте меню ⋯ у любой композиции в медиатеке и добавьте её сюда." />}
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Свои подборки" title="Плейлисты" description="Собирайте музыку под задачу, настроение или время суток." actions={<button className="primary-button" onClick={() => setCreating(true)}><Plus size={17} />Новый плейлист</button>} />
      {playlists.length > 0 ? (
        <div className="playlist-grid">
          {playlists.map((playlist, index) => (
            <button className="playlist-card" onClick={() => setSelectedId(playlist.id)} key={playlist.id}>
              <span className={`playlist-art tone-${index % 4}`}><ListMusic size={31} /></span>
              <strong>{playlist.name}</strong><span>{formatCount(playlist.trackIds.length, 'трек', 'трека', 'треков')}</span>
            </button>
          ))}
        </div>
      ) : <EmptyState icon={ListMusic} title="Создайте первый плейлист" description="Плейлисты хранятся только на этом компьютере и доступны без интернета." action={<button className="primary-button" onClick={() => setCreating(true)}><Plus size={17} />Создать плейлист</button>} />}
      {creating && <Modal title="Новый плейлист" onClose={() => setCreating(false)}><form className="form-stack" onSubmit={create}><label><span>Название</span><input name="name" autoFocus required maxLength={80} placeholder="Например, Глубокая работа" /></label><div className="form-actions"><button type="button" className="secondary-button" onClick={() => setCreating(false)}>Отмена</button><button className="primary-button">Создать</button></div></form></Modal>}
    </div>
  );
}

