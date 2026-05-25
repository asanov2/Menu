// === FILE: frontend/packages/admin/src/App.tsx ===
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@qrmenu/ui';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import MenusPage from './pages/Menus/MenusPage';
import MenuDetailPage from './pages/Menus/MenuDetailPage';
import QRPage from './pages/Menus/QRPage';
import BillingPage from './pages/Billing/BillingPage';
import ProfilePage from './pages/Profile/ProfilePage';
import TelegramPage from './pages/Telegram/TelegramPage';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/menus" element={<PrivateRoute><MenusPage /></PrivateRoute>} />
        <Route path="/menus/:id" element={<PrivateRoute><MenuDetailPage /></PrivateRoute>} />
        <Route path="/menus/:id/qr" element={<PrivateRoute><QRPage /></PrivateRoute>} />
        <Route path="/billing" element={<PrivateRoute><BillingPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/telegram" element={<PrivateRoute><TelegramPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ToastProvider>
  );
}
