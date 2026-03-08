<script setup lang="ts">
import AppHeader from './components/common/AppHeader.vue';
</script>

<template>
  <div class="app-container">
    <AppHeader />
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--morandi-bg);
}
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
