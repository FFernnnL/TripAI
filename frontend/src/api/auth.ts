import client from './client';
import type { LoginResponse } from '../types/user';

export function register(email: string, username: string, password: string) {
  return client.post<LoginResponse>('/api/auth/register', { email, username, password });
}

export function login(email: string, password: string) {
  return client.post<LoginResponse>('/api/auth/login', { email, password });
}

export function getMe() {
  return client.get('/api/auth/me');
}
