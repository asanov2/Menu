// === FILE: frontend/packages/owner/src/components/PrivateRoute.tsx ===
import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useOwnerStore } from '../store/ownerStore'
import OwnerLayout from '../layout/OwnerLayout'

function isTokenExpired(token: string): boolean {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(base64))
    return typeof exp === 'number' && exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const token = useOwnerStore(s => s.token)
  const logout = useOwnerStore(s => s.logout)

  if (!token || isTokenExpired(token)) {
    if (token) logout()
    return <Navigate to="/login" replace />
  }

  return <OwnerLayout>{children}</OwnerLayout>
}
