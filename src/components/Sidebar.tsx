import {
  Disc3,
  Heart,
  Home,
  Library,
  ListMusic,
  Radio,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import type { PageId } from '../types';

const navigation: Array<{ id: PageId; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'radio', label: 'Радио', icon: Radio },
  { id: 'library', label: 'Медиатека', icon: Library },
  { id: 'playlists', label: 'Плейлисты', icon: ListMusic },
  { id: 'favorites', label: 'Избранное', icon: Heart },
];

export function Sidebar() {
  const page = useAppStore((state) => state.page);
  const setPage = useAppStore((state) => state.setPage);

  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => setPage('home')} aria-label="LOFI DESK — на главную">
        <span className="brand-mark"><Disc3 size={22} /></span>
        <span><strong>LOFI</strong> DESK</span>
      </button>

      <nav className="nav-list" aria-label="Основная навигация">
        <p className="nav-caption">Пространство</p>
        {navigation.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => setPage(id)}>
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="focus-note">
          <Sparkles size={17} />
          <div><strong>Тихий режим</strong><span>Музыка остаётся в трее</span></div>
        </div>
        <button className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => setPage('settings')}>
          <Settings size={18} strokeWidth={1.8} />
          <span>Настройки</span>
        </button>
      </div>
    </aside>
  );
}

