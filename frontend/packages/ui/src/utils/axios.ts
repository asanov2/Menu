/// <reference types="vite/client" />
import axios from 'axios';

export function createApiClient(baseURL: string) {
  const client = axios.create({ baseURL });
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  return client;
}

export const menuApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
});

export const adminApi = (() => {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '',
    headers: { 'Content-Type': 'application/json' },
  });
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  return client;
})();
