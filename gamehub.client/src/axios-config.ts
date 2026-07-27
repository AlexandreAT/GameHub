import Axios from 'axios';
import { clearAuthToken, getAuthToken, setAuthToken } from './auth-storage';

const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const axios = Axios.create({
  baseURL: configuredApiUrl ? configuredApiUrl.replace(/\/$/, '') : '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axios.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthToken();
    }
    return Promise.reject(error);
  }
);

export { axios, clearAuthToken, getAuthToken, setAuthToken };
