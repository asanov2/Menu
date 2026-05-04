// === FILE: frontend/packages/owner/src/layout/OwnerLayout.tsx ===
import { ReactNode } from 'react'
import OwnerSidebar from './OwnerSidebar'
import OwnerTopbar from './OwnerTopbar'

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--cream-bg)',
      }}
    >
      <OwnerSidebar />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <OwnerTopbar />
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
