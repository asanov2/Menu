import axios from 'axios';

export const ownerApi = (() => {
  const client = axios.create({
    baseURL: '',
    headers: { 'Content-Type': 'application/json' },
  });
  client.interceptors.request.use((cfg) => {
    const token = localStorage.getItem('owner_token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
  });
  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem('owner_token');
        window.location.href = '/login';
      }
      return Promise.reject(err);
    },
  );
  return client;
})();
