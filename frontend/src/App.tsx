import { Routes, Route } from 'react-router-dom';
import MenuPage from './pages/Menu/MenuPage';
import MenuNotFound from './pages/NotFound/MenuNotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/menu/:slug" element={<MenuPage />} />
      <Route path="*" element={<MenuNotFound />} />
    </Routes>
  );
}
