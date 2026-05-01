import { Routes, Route } from 'react-router-dom';
import MenuPage from './pages/MenuPage';
import MenuNotFound from './pages/MenuNotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/menu/:slug" element={<MenuPage />} />
      <Route path="*" element={<MenuNotFound />} />
    </Routes>
  );
}
