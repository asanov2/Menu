// === FILE: frontend/packages/admin/src/components/PrivateRoute.tsx ===
import { ReactNode, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@qrmenu/ui';
import { useAuthStore } from '../store/authStore';
import AdminLayout from '../layout/AdminLayout';
import styles from './PrivateRoute.module.css';

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const { token, isLoading, initialize } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initialize();
    }
  }, [initialize]);

  if (isLoading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingInner}>
          <Skeleton height="20px" />
          <Skeleton height="20px" width="80%" />
          <Skeleton height="20px" width="60%" />
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
