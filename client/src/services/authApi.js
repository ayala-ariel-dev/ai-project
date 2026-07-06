import axios from 'axios';
import {
  clearAuthStorage,
  getAccessToken,
  setAccessToken,
  setCurrentUser,
} from './authStorage';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const authApi = axios.create({
  baseURL: apiBaseUrl,
});

authApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function loginWithGoogleIdToken(idToken) {
  const { data } = await authApi.post('/auth/google', { idToken });

  setAccessToken(data.accessToken);
  setCurrentUser(data.user);
  return data.user;
}

export async function fetchCurrentUser() {
  const { data } = await authApi.get('/auth/me');
  setCurrentUser(data.user);
  return data.user;
}

export function logout() {
  clearAuthStorage();
}
