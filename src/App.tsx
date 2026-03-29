import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GamePlayer from './pages/GamePlayer';
import AllGames from './pages/AllGames';
import PopularGames from './pages/PopularGames';
import BackgroundManager from './components/BackgroundManager';
import { ThemeProvider } from './context/ThemeContext';
import { FavoritesProvider } from './context/FavoritesContext';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import ChatPage from './pages/ChatPage';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <FavoritesProvider>
          <BrowserRouter>
            <BackgroundManager />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/all-games" element={<AllGames />} />
              <Route path="/popular" element={<PopularGames />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/play/:id" element={<GamePlayer />} />
              <Route path="/chat" element={<ChatPage />} />
            </Routes>
          </BrowserRouter>
        </FavoritesProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
