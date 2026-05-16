// === FILE: frontend/packages/owner/src/App.tsx ===
import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useOwnerStore } from './store/ownerStore'
import PrivateRoute from './components/PrivateRoute'
import OwnerLoginPage from './pages/Login/OwnerLoginPage'
import OwnerDashboardPage from './pages/Dashboard/OwnerDashboardPage'
import RestaurantsPage from './pages/Restaurants/RestaurantsPage'
import RevenuePage from './pages/Revenue/RevenuePage'
import SystemPage from './pages/System/SystemPage'
import ApplicationsPage from './pages/Applications/ApplicationsPage'

export default function App() {
  const initialize = useOwnerStore(s => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <Routes>
      <Route path="/login" element={<OwnerLoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<PrivateRoute><OwnerDashboardPage /></PrivateRoute>} />
      <Route path="/restaurants" element={<PrivateRoute><RestaurantsPage /></PrivateRoute>} />
      <Route path="/revenue" element={<PrivateRoute><RevenuePage /></PrivateRoute>} />
      <Route path="/system" element={<PrivateRoute><SystemPage /></PrivateRoute>} />
      <Route path="/applications" element={<PrivateRoute><ApplicationsPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
