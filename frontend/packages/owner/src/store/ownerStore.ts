// === FILE: frontend/packages/owner/src/store/ownerStore.ts ===
import { create } from 'zustand'
import axios from 'axios'

export const ownerApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
})

ownerApi.interceptors.request.use(config => {
  const token = localStorage.getItem('owner_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

ownerApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('owner_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

interface OwnerStore {
  token: string | null
  isLoading: boolean
  setToken: (token: string) => void
  logout: () => void
  initialize: () => void
}

export const useOwnerStore = create<OwnerStore>(set => ({
  token: null,
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
