import { FolderOpen, RefreshCw, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { TrackTable } from '../components/TrackTable';
import { chooseAndScanFolder, mergeScans, scanFolder } from '../services/tauri';
import { useAppStore } from '../stores/useAppStore';
import { fileName, formatCount } from '../utils/format';

export function LibraryPage() {
  const tracks = useAppStore((state) => state.tracks);
  const folders = useAppStore((state) => state.folders);
  const setLibrary = useAppStore((state) => state.setLibrary);
  const replaceTracks = useAppStore((state) => state.replaceTracks);
  const removeFolder = useAppStore((state) => state.removeFolder);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const filtered = useMemo(() => tracks.filter((track) => `${track.title} ${track.artist} ${track.album}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [tracks, query]);

  const addFolder = async () => {
    setBusy(true); setMessage(null);
    try {
      const scan = await chooseAndScanFolder();
      if (scan) {
        setLibrary(scan.folder, scan.tracks);
        setMessage(`Добавлено: ${formatCount(scan.tracks.length, 'трек', 'трека', 'треков')}${scan.skipped ? `, пропущено: ${scan.skipped}` : ''}.`);
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Не удалось просканировать папку.'); }
    finally { setBusy(false); }
  };

  const rescan = async () => {
    if (!folders.length) return;
    setBusy(true); setMessage('Сканируем вложенные папки…');
    try {
      const scans = await Promise.all(folders.map(scanFolder));
      const merged = mergeScans(scans);
      replaceTracks(merged);
      setMessage(`Медиатека обновлена: ${formatCount(merged.length, 'трек', 'трека', 'треков')}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Повторное сканирование не удалось.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Локально и без интернета" title="Медиатека" description="MP3, FLAC, WAV и OGG из выбранных папок на вашем компьютере." actions={
        <><button className="secondary-button" disabled={busy || !folders.length} onClick={() => void rescan()}><RefreshCw size={17} className={busy ? 'spin' : ''} />Пересканировать</button><button className="primary-button" disabled={busy} onClick={() => void addFolder()}><FolderOpen size={17} />Добавить папку</button></>
      } />

      {folders.length > 0 && <div className="folder-chips">{folders.map((folder) => <span key={folder} title={folder}><FolderOpen size={14} />{fileName(folder)}<button onClick={() => removeFolder(folder)} aria-label="Убрать папку"><X size={13} /></button></span>)}</div>}
      {message && <div className="status-note">{message}</div>}

      {tracks.length > 0 ? (
        <>
          <div className="toolbar"><label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название, исполнитель или альбом" /></label><span className="toolbar-meta">{formatCount(filtered.length, 'трек', 'трека', 'треков')}</span></div>
          <TrackTable tracks={filtered} />
        </>
      ) : (
        <EmptyState icon={FolderOpen} title="Ваша музыка появится здесь" description="Выберите папку — LOFI DESK найдёт поддерживаемые файлы во всех вложенных каталогах и прочитает их метаданные." action={<button className="primary-button" disabled={busy} onClick={() => void addFolder()}><FolderOpen size={17} />Выбрать папку</button>} />
      )}
    </div>
  );
}

