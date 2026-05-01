// === FILE: frontend/packages/admin/src/layout/AdminLayout.tsx ===
import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <style>{`
        :root { --sidebar-width: 220px; }
        .admin-main::-webkit-scrollbar { width: 6px; }
        .admin-main::-webkit-scrollbar-track { background: transparent; }
        .admin-main::-webkit-scrollbar-thumb { background: var(--cream-border); border-radius: 3px; }
      `}</style>
      <Sidebar />
      <div
        className="admin-main"
        style={{
          marginLeft: 'var(--sidebar-width)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--cream-warm)',
          minHeight: '100vh',
          overflowY: 'auto',
        }}
      >
        <Topbar />
        <main style={{ flex: 1, padding: '24px 28px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
