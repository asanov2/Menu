/// <reference types="vite/client" />
import axios from 'axios';

export function createApiClient(baseURL: string) {
  const client = axios.create({ baseURL });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
}

export const menuApi = createApiClient(
  (import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env.VITE_API_URL ?? '/api/v1'
);

export const adminApi = createApiClient(
  (import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env.VITE_API_URL ?? '/api/v1'
);
