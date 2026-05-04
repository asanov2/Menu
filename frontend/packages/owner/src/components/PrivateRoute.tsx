// === FILE: frontend/packages/owner/src/components/PrivateRoute.tsx ===
import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useOwnerStore } from '../store/ownerStore'
import OwnerLayout from '../layout/OwnerLayout'

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const token = useOwnerStore(s => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <OwnerLayout>{children}</OwnerLayout>
}
