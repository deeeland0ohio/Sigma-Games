import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import GamePlayer from './pages/GamePlayer';
import AllGames from './pages/AllGames';
import BackgroundManager from './components/BackgroundManager';
import SettingsOverlay from './components/SettingsOverlay';
import { ThemeProvider } from './context/ThemeContext';
import { FavoritesProvider } from './context/FavoritesContext';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import ChatPage from './pages/ChatPage';
import ErrorBoundary from './components/ErrorBoundary';
import GnMath from './pages/GnMath';
import UgsFiles from './pages/UgsFiles';
import SeraphGames from './pages/SeraphGames';
import Threekh0Games from './pages/Threekh0Games';
import NoahGames from './pages/NoahGames';
import AlexrGames from './pages/AlexrGames';
import HydraGames from './pages/HydraGames';
import ExternalPlayer from './pages/ExternalPlayer';
import NotFound from './pages/NotFound';
import Entertainment from './pages/Entertainment';

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;

    // Track ONLY the home page
    if (currentPath === '/') {
      const umami = (window as any).umami;
      if (umami && typeof umami.track === 'function') {
        // Track page view manually
        umami.track();
      }
    }
  }, [location]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <FavoritesProvider>
          <HashRouter>
            <AnalyticsTracker />
            <BackgroundManager />
            <SettingsOverlay />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/our-games" element={<AllGames />} />
              <Route path="/favorites" element={<Favorites />} />

              <Route path="/settings" element={<Settings />} />
              <Route path="/play/:id" element={<GamePlayer />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/gn-math" element={<GnMath />} />
              <Route path="/ugs" element={<UgsFiles />} />
              <Route path="/seraph" element={<SeraphGames />} />
              <Route path="/3kh0" element={<Threekh0Games />} />
              <Route path="/noah" element={<NoahGames />} />
              <Route path="/alexr" element={<AlexrGames />} />
              <Route path="/hydra" element={<HydraGames />} />
              <Route path="/entertainment" element={<Entertainment />} />
              <Route path="/external-player" element={<ExternalPlayer />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </FavoritesProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
