import axios from 'axios';
import { MenuData } from '../types/menu';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const fetchMenu = async (slug: string, lang: string): Promise<MenuData> => {
  const { data } = await api.get<MenuData>(`/menu/${slug}`, {
    params: { lang },
  });
  return data;
};

export const callWaiter = async (slug: string, table: number): Promise<void> => {
  await api.post(`/menu/${slug}/call-waiter`, { table });
};
