<script setup lang="ts">
import { computed } from 'vue';
import { useItineraryStore } from '../stores/itinerary';

const store = useItineraryStore();

const progress = computed(() => {
  if (store.generatedDays.length === 0) return 10;
  // Estimate progress (we don't know total days yet, estimate from generated)
  return Math.min(10 + store.generatedDays.length * 20, 90);
});
</script>

<template>
  <div class="generating-page">
    <div class="generating-content">
      <!-- Animation area -->
      <div class="animation-area">
        <svg viewBox="0 0 200 200" class="generating-svg">
          <circle cx="100" cy="100" r="80" stroke="var(--morandi-border)" stroke-width="1" fill="none" stroke-dasharray="8 4"/>
          <circle cx="100" cy="100" r="60" stroke="var(--morandi-primary-light)" stroke-width="1" fill="none" stroke-dasharray="6 3" class="rotate-slow"/>
          <circle cx="100" cy="100" r="40" stroke="var(--morandi-primary)" stroke-width="1.5" fill="none" stroke-dasharray="4 2" class="rotate-reverse"/>
          <circle cx="100" cy="100" r="8" fill="var(--morandi-primary)" class="pulse"/>
        </svg>
      </div>

      <!-- Status text -->
      <h2 class="status-title">{{ store.generatingStatus || '正在准备...' }}</h2>
      <p class="status-subtitle">AI 正在为您精心规划旅行行程</p>

      <!-- Progress bar -->
      <div class="progress-wrapper">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>

      <!-- Generated days preview -->
      <div v-if="store.generatedDays.length > 0" class="days-preview">
        <div
          v-for="(day, i) in store.generatedDays"
          :key="i"
          class="day-preview-card"
          :style="{ animationDelay: i * 0.15 + 's' }"
        >
          <div class="day-badge" :style="{ background: ['#A8B5C4','#B5C4A8','#C4B8A8','#C4A8B5','#C4C4A8','#A8C4C4','#B5A8C4'][i % 7] }">
            Day {{ day.dayNumber }}
          </div>
          <div class="day-info">
            <h4>{{ day.theme }}</h4>
            <p>{{ day.spots?.length || 0 }} 个景点 / {{ day.restaurants?.length || 0 }} 个餐厅</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.generating-page {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}
.generating-content {
  text-align: center;
  max-width: 500px;
  width: 100%;
}
.animation-area {
  margin-bottom: 32px;
}
.generating-svg {
  width: 140px;
  height: 140px;
}
.rotate-slow {
  animation: spin 8s linear infinite;
  transform-origin: center;
}
.rotate-reverse {
  animation: spin 5s linear infinite reverse;
  transform-origin: center;
}
.pulse {
  animation: pulse 2s ease-in-out infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { r: 8; opacity: 1; }
  50% { r: 12; opacity: 0.6; }
}
.status-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--morandi-text);
  margin-bottom: 8px;
}
.status-subtitle {
  font-size: 14px;
  color: var(--morandi-text-secondary);
  margin-bottom: 28px;
}
.progress-wrapper {
  padding: 0 20px;
  margin-bottom: 32px;
}
.progress-bar {
  height: 6px;
  background: var(--morandi-border-light);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--morandi-primary-light), var(--morandi-primary-dark));
  border-radius: 3px;
  transition: width 0.8s ease;
}
.days-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.day-preview-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: white;
  border-radius: 14px;
  border: 1px solid var(--morandi-border-light);
  text-align: left;
  animation: slideIn 0.4s ease-out both;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.day-badge {
  padding: 4px 12px;
  border-radius: 12px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.day-info h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--morandi-text);
  margin-bottom: 2px;
}
.day-info p {
  font-size: 13px;
  color: var(--morandi-text-secondary);
}
</style>
