// === FILE: frontend/packages/admin/src/store/authStore.ts ===
import { create } from 'zustand';
import type { RestaurantAuth } from '@qrmenu/ui';

interface AuthState {
  token: string | null;
  restaurant: RestaurantAuth | null;
  isLoading: boolean;
  setAuth: (token: string, restaurant: RestaurantAuth) => void;
  logout: () => void;
  initialize: () => void;
}

function parseJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ?? null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  restaurant: null,
  isLoading: true,

  setAuth: (token, restaurant) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_restaurant', JSON.stringify(restaurant));
    set({ token, restaurant });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_restaurant');
    set({ token: null, restaurant: null });
  },

  initialize: () => {
    const token = localStorage.getItem('auth_token');
    const restaurantRaw = localStorage.getItem('auth_restaurant');

    if (token && restaurantRaw) {
      const exp = parseJwtExp(token);
      const isExpired = exp !== null && exp * 1000 < Date.now();
      if (!isExpired) {
        try {
          const restaurant = JSON.parse(restaurantRaw) as RestaurantAuth;
          set({ token, restaurant, isLoading: false });
          return;
        } catch {}
      }
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_restaurant');
    set({ token: null, restaurant: null, isLoading: false });
  },
}));
