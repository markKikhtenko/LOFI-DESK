import { PlayerBar } from './components/PlayerBar';
import { Sidebar } from './components/Sidebar';
import { BiomeScene } from './components/BiomeScene';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useUpdater } from './hooks/useUpdater';
import { FavoritesPage } from './pages/FavoritesPage';
import { HomePage } from './pages/HomePage';
import { LibraryPage } from './pages/LibraryPage';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { RadioPage } from './pages/RadioPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAppStore } from './stores/useAppStore';

export default function App() {
  const page = useAppStore((state) => state.page);
  const glowEnabled = useAppStore((state) => state.glowEnabled);
  const current = useAppStore((state) => state.current);
  const stations = useAppStore((state) => state.stations);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const playbackError = useAppStore((state) => state.playbackError);
  const currentStation = current?.kind === 'station' ? stations.find((station) => station.id === current.id) : undefined;
  const biomeMode = currentStation?.visual === 'biomes' && isPlaying && !playbackError;
  useAudioEngine();
  const updater = useUpdater(true);
  const pages = {
    home: <HomePage />,
    radio: <RadioPage />,
    library: <LibraryPage />,
    playlists: <PlaylistsPage />,
    favorites: <FavoritesPage />,
    settings: <SettingsPage update={updater.state} onCheck={() => void updater.checkForUpdates()} onInstall={() => void updater.installUpdate()} />,
  };

  return (
    <div className={`app-shell ${glowEnabled ? 'glow-on' : ''} ${biomeMode ? 'biome-mode' : ''}`}>
      <BiomeScene variant="backdrop" active={biomeMode} />
      <Sidebar />
      <main className="main-content">{pages[page]}</main>
      <PlayerBar />
    </div>
  );
}
