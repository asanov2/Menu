// === FILE: frontend/packages/owner/src/store/ownerStore.ts ===
import { create } from 'zustand'

interface OwnerStore {
  token: string | null
  isLoading: boolean
  setToken: (token: string) => void
  logout: () => void
  initialize: () => void
}

export const useOwnerStore = create<OwnerStore>(set => ({
  token: localStorage.getItem('owner_token'),
  isLoading: false,

  setToken: (token) => {
    localStorage.setItem('owner_token', token)
    set({ token })
  },

  logout: () => {
    localStorage.removeItem('owner_token')
    set({ token: null })
    window.location.href = '/login'
  },

  initialize: () => {
    const token = localStorage.getItem('owner_token')
    if (token) set({ token })
  },
}))
