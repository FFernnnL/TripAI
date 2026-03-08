<script setup lang="ts">
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

function handleLogout() {
  auth.logout();
  router.push('/');
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <router-link to="/" class="logo-link">
        <svg class="logo-icon" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2"/>
          <path d="M10 20 L16 10 L22 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="16" cy="13" r="2" fill="currentColor"/>
        </svg>
        <span class="logo-text">Trip Planner</span>
      </router-link>
    </div>
    <nav class="header-nav">
      <router-link v-if="auth.isLoggedIn" to="/plan" class="nav-link">
        <svg viewBox="0 0 20 20" fill="none" class="nav-icon"><path d="M10 3v14M3 10h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        新建行程
      </router-link>
      <router-link v-if="auth.isLoggedIn" to="/my-trips" class="nav-link">
        <svg viewBox="0 0 20 20" fill="none" class="nav-icon"><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 4V2M13 4V2M3 8h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        我的行程
      </router-link>
    </nav>
    <div class="header-right">
      <template v-if="auth.isLoggedIn">
        <div class="user-info">
          <div class="user-avatar">{{ auth.user?.username?.charAt(0) || 'U' }}</div>
          <span class="username">{{ auth.user?.username }}</span>
        </div>
        <button class="btn-logout" @click="handleLogout">退出</button>
      </template>
      <template v-else>
        <router-link to="/auth" class="btn-login">登录</router-link>
      </template>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--morandi-border-light);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-left {
  display: flex;
  align-items: center;
}
.logo-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--morandi-text);
  text-decoration: none;
  font-weight: 600;
  font-size: 18px;
}
.logo-icon {
  width: 28px;
  height: 28px;
  color: var(--morandi-primary-dark);
}
.logo-text {
  background: linear-gradient(135deg, var(--morandi-primary-dark), var(--morandi-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.header-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 20px;
  color: var(--morandi-text-light);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
}
.nav-link:hover {
  background: var(--morandi-bg-hover);
  color: var(--morandi-text);
}
.nav-link.router-link-active {
  background: var(--morandi-bg-hover);
  color: var(--morandi-primary-dark);
}
.nav-icon {
  width: 16px;
  height: 16px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--morandi-primary-light), var(--morandi-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 600;
}
.username {
  font-size: 14px;
  color: var(--morandi-text);
}
.btn-login {
  padding: 6px 20px;
  border-radius: 20px;
  background: var(--morandi-primary);
  color: white;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
}
.btn-login:hover {
  background: var(--morandi-primary-dark);
  color: white;
}
.btn-logout {
  padding: 4px 12px;
  border-radius: 16px;
  border: 1px solid var(--morandi-border);
  background: transparent;
  color: var(--morandi-text-light);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-logout:hover {
  border-color: var(--morandi-error);
  color: var(--morandi-error);
}
</style>
