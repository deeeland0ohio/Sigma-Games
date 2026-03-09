import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GamePlayer from './pages/GamePlayer';
import AllGames from './pages/AllGames';
import PopularGames from './pages/PopularGames';
import BackgroundManager from './components/BackgroundManager';
import { ThemeProvider } from './context/ThemeContext';
import { FavoritesProvider } from './context/FavoritesContext';
import Favorites from './pages/Favorites';

export default function App() {
  return (
    <ThemeProvider>
      <FavoritesProvider>
        <BrowserRouter>
          <BackgroundManager />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/all-games" element={<AllGames />} />
            <Route path="/popular" element={<PopularGames />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/play/:id" element={<GamePlayer />} />
          </Routes>
        </BrowserRouter>
      </FavoritesProvider>
    </ThemeProvider>
  );
}
