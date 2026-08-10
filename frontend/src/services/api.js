import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('chefai_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('chefai_token');
      localStorage.removeItem('chefai_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
