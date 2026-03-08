import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '../types/user';
import * as authApi from '../api/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);

  const isLoggedIn = computed(() => !!token.value);

  function init() {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      token.value = savedToken;
      try {
        user.value = JSON.parse(savedUser);
      } catch {
        logout();
      }
    }
  }

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password);
    user.value = res.data.user;
    token.value = res.data.token;
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
  }

  async function register(email: string, username: string, password: string) {
    const res = await authApi.register(email, username, password);
    user.value = res.data.user;
    token.value = res.data.token;
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return { user, token, isLoggedIn, init, login, register, logout };
});
