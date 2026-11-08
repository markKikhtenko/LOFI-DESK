import { CheckCircle2, Download, ExternalLink, FolderOpen, Info, RefreshCw, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { isTauri } from '../services/tauri';
import type { UpdateState } from '../types';
import { useAppStore } from '../stores/useAppStore';
import { fileName } from '../utils/format';

export function SettingsPage({ update, onCheck, onInstall }: { update: UpdateState; onCheck: () => void; onInstall: () => void }) {
  const folders = useAppStore((state) => state.folders);
  const volume = useAppStore((state) => state.volume);
  const setVolume = useAppStore((state) => state.setVolume);
  const busy = update.status === 'checking' || update.status === 'downloading';
  return (
    <div className="page settings-page">
      <PageHeader eyebrow="LOFI DESK" title="Настройки" description="Воспроизведение, медиатека и безопасные обновления приложения." />
      <div className="settings-layout">
        <section className="settings-card">
          <div className="settings-card-title"><span className="settings-icon purple"><Download size={19} /></span><div><h2>Обновления</h2><p>Подписанные выпуски из GitHub Releases</p></div></div>
          <div className="version-row"><div><span>Текущая версия</span><strong>v{update.currentVersion}</strong></div><span className={`update-badge ${update.status}`}><ShieldCheck size={14} />{update.status === 'available' ? `Доступна v${update.availableVersion}` : 'Проверка подписи включена'}</span></div>
          {update.notes && <div className="release-notes"><strong>Что нового</strong><p>{update.notes}</p></div>}
          {update.status === 'downloading' && <div className="download-progress"><div><span>Загрузка и проверка</span><strong>{update.progress}%</strong></div><progress max="100" value={update.progress} /></div>}
          {update.message && <div className={`status-note ${update.status === 'error' ? 'error' : ''}`}>{update.status === 'up-to-date' && <CheckCircle2 size={15} />}{update.message}</div>}
          <div className="settings-actions">
            <button className="secondary-button" disabled={busy} onClick={onCheck}><RefreshCw size={16} className={update.status === 'checking' ? 'spin' : ''} />Проверить обновления</button>
            {update.status === 'available' && <button className="primary-button" onClick={onInstall}><Download size={16} />Скачать и установить</button>}
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-title"><span className="settings-icon blue"><FolderOpen size={19} /></span><div><h2>Медиатека</h2><p>Папки сканируются только локально</p></div></div>
          <div className="settings-list">
            {folders.length ? folders.map((folder) => <div key={folder}><FolderOpen size={16} /><span title={folder}>{fileName(folder)}<small>{folder}</small></span></div>) : <p className="muted-copy">Папки ещё не добавлены. Откройте раздел «Медиатека».</p>}
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-title"><span className="settings-icon amber"><Info size={19} /></span><div><h2>Воспроизведение</h2><p>Общие параметры аудио</p></div></div>
          <label className="setting-control"><span><strong>Громкость по умолчанию</strong><small>Сохраняется между запусками</small></span><div><input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} style={{ '--range-progress': `${volume * 100}%` } as React.CSSProperties} /><b>{Math.round(volume * 100)}%</b></div></label>
        </section>

        <section className="settings-card about-card">
          <div><strong>LOFI DESK</strong><span>v{update.currentVersion}</span></div>
          <p>Открытый настольный плеер на Tauri 2. Пользовательские данные находятся в профиле Windows и не удаляются при обновлении приложения.</p>
          <a href="https://github.com/markKikhtenko/LOFI-DESK" target="_blank" rel="noreferrer">Исходный код <ExternalLink size={14} /></a>
          {!isTauri() && <small>Сейчас открыт браузерный режим предпросмотра: системные функции отключены.</small>}
        </section>
      </div>
    </div>
  );
}
