// === FILE: frontend/packages/admin/src/hooks/useAuth.ts ===
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { token, restaurant, logout } = useAuthStore();
  return {
    token,
    restaurant,
    logout,
    isAuthenticated: !!token,
  };
}
