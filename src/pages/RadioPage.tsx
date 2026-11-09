import { Plus, Radio, Search } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StationCard } from '../components/StationCard';
import { useAppStore } from '../stores/useAppStore';
import type { Station } from '../types';

const accents = ['#8298ff', '#9a7be8', '#d39b6a', '#6dada4'];

export function RadioPage() {
  const stations = useAppStore((state) => state.stations);
  const addStation = useAppStore((state) => state.addStation);
  const updateStation = useAppStore((state) => state.updateStation);
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<Station | 'new' | null>(null);
  const filtered = useMemo(() => stations.filter((station) => `${station.name} ${station.description}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [stations, query]);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const streamUrl = String(data.get('streamUrl') ?? '').trim();
    const description = String(data.get('description') ?? '').trim();
    if (!name || !/^https?:\/\//i.test(streamUrl)) return;
    const station: Station = editor !== 'new' && editor
      ? { ...editor, name, streamUrl, description }
      : { id: crypto.randomUUID(), name, streamUrl, description: description || 'Пользовательская интернет-радиостанция.', accent: accents[stations.length % accents.length]!, isBuiltIn: false };
    if (editor === 'new') addStation(station);
    else updateStation(station);
    setEditor(null);
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Прямой эфир" title="Интернет-радио" description="MP3-потоки SomaFM и добавленные вами станции." actions={<button className="primary-button" onClick={() => setEditor('new')}><Plus size={17} />Добавить станцию</button>} />
      <div className="toolbar">
        <label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти станцию" /></label>
        <span className="toolbar-meta">{filtered.length} в каталоге</span>
      </div>
      {filtered.length > 0
        ? <div className="station-grid">{filtered.map((station) => <StationCard station={station} key={station.id} onEdit={setEditor} />)}</div>
        : <EmptyState icon={Radio} title="Станции не найдены" description="Измените запрос или добавьте прямую ссылку на MP3/AAC-поток." />}

      {editor && (
        <Modal title={editor === 'new' ? 'Новая радиостанция' : 'Редактировать станцию'} onClose={() => setEditor(null)}>
          <form className="form-stack" onSubmit={save}>
            <label><span>Название</span><input name="name" required maxLength={80} defaultValue={editor === 'new' ? '' : editor.name} placeholder="Например, Night Radio" /></label>
            <label><span>Прямая ссылка на поток</span><input name="streamUrl" required type="url" defaultValue={editor === 'new' ? '' : editor.streamUrl} placeholder="https://radio.example/stream.mp3" /></label>
            <label><span>Описание</span><textarea name="description" rows={3} maxLength={220} defaultValue={editor === 'new' ? '' : editor.description} placeholder="Коротко о настроении станции" /></label>
            <p className="form-hint">Нужен прямой аудиопоток MP3/AAC. Ссылки на веб-страницы не воспроизводятся.</p>
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setEditor(null)}>Отмена</button><button className="primary-button">Сохранить</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
