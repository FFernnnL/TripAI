<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getItineraries, deleteItinerary } from '../api/itinerary';
import { getDayColor } from '../utils/colors';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { Itinerary } from '../types/itinerary';

const router = useRouter();
const loading = ref(true);
const itineraries = ref<Itinerary[]>([]);

onMounted(async () => {
  try {
    const res = await getItineraries();
    itineraries.value = res.data;
  } catch {
    ElMessage.error('加载行程列表失败');
  } finally {
    loading.value = false;
  }
});

function openItinerary(id: string) {
  router.push(`/itinerary/${id}`);
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该行程吗？此操作不可撤销。', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await deleteItinerary(id);
    itineraries.value = itineraries.value.filter((i) => i.id !== id);
    ElMessage.success('已删除');
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除失败');
  }
}

function getDestinations(dest: string): string[] {
  try {
    return JSON.parse(dest);
  } catch {
    return [dest];
  }
}
</script>

<template>
  <div class="my-trips-page" v-loading="loading">
    <div class="trips-container">
      <div class="trips-header">
        <h1>我的行程</h1>
        <el-button type="primary" round @click="router.push('/plan')">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="margin-right:4px"><path d="M8 3v10M3 8h10" stroke-linecap="round"/></svg>
          新建行程
        </el-button>
      </div>

      <div v-if="!loading && itineraries.length === 0" class="empty-state">
        <svg viewBox="0 0 80 80" fill="none" class="empty-icon">
          <circle cx="40" cy="40" r="35" stroke="var(--morandi-border)" stroke-width="1.5" stroke-dasharray="6 3"/>
          <path d="M30 48 L40 28 L50 48" stroke="var(--morandi-primary-light)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="40" cy="35" r="3" fill="var(--morandi-primary-light)"/>
        </svg>
        <h3>还没有行程</h3>
        <p>开始规划你的第一次旅行吧！</p>
        <el-button type="primary" round @click="router.push('/plan')">开始规划</el-button>
      </div>

      <div v-else class="trips-grid">
        <div
          v-for="trip in itineraries"
          :key="trip.id"
          class="trip-card card-hover"
          @click="openItinerary(trip.id)"
        >
          <div class="trip-card-header">
            <h3>{{ trip.title }}</h3>
            <button class="delete-btn" @click.stop="handleDelete(trip.id)" title="删除">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M2 4h12M5.3 4V2.7a.7.7 0 01.7-.7h4a.7.7 0 01.7.7V4M6.7 7.3v4M9.3 7.3v4M3.3 4l.9 9.3a1.3 1.3 0 001.3 1.2h5a1.3 1.3 0 001.3-1.2L12.7 4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          <div class="trip-card-tags">
            <el-tag
              v-for="(dest, i) in getDestinations(trip.destinations)"
              :key="i"
              size="small"
              effect="plain"
              :style="{ borderColor: getDayColor(i), color: getDayColor(i) }"
            >
              {{ dest }}
            </el-tag>
          </div>
          <div class="trip-card-meta">
            <span>{{ trip.startDate }} ~ {{ trip.endDate }}</span>
            <span>{{ trip.totalDays }}天</span>
            <span>{{ trip.adults }}成人{{ trip.children > 0 ? ` ${trip.children}儿童` : '' }}</span>
          </div>
          <div class="trip-card-days">
            <div
              v-for="(day, i) in (trip.days || []).slice(0, 5)"
              :key="i"
              class="mini-day"
              :style="{ borderLeftColor: getDayColor(i) }"
            >
              Day {{ day.dayNumber }}: {{ day.theme }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.my-trips-page {
  flex: 1;
  overflow-y: auto;
  padding: 32px 20px 60px;
}
.trips-container {
  max-width: 900px;
  margin: 0 auto;
}
.trips-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}
.trips-header h1 {
  font-size: 26px;
  font-weight: 700;
  color: var(--morandi-text);
}
.empty-state {
  text-align: center;
  padding: 60px 20px;
}
.empty-icon { width: 80px; height: 80px; margin-bottom: 16px; }
.empty-state h3 {
  font-size: 18px;
  color: var(--morandi-text);
  margin-bottom: 8px;
}
.empty-state p {
  font-size: 14px;
  color: var(--morandi-text-secondary);
  margin-bottom: 20px;
}
.trips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
}
.trip-card {
  background: white;
  border-radius: 18px;
  padding: 22px;
  border: 1px solid var(--morandi-border-light);
  cursor: pointer;
}
.trip-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.trip-card-header h3 {
  font-size: 17px;
  font-weight: 600;
  color: var(--morandi-text);
}
.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--morandi-border);
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
}
.delete-btn:hover { color: var(--morandi-error); background: #fef0ed; }
.trip-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.trip-card-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--morandi-text-secondary);
  margin-bottom: 12px;
}
.trip-card-days {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mini-day {
  padding: 4px 10px;
  border-left: 3px solid;
  font-size: 12px;
  color: var(--morandi-text-light);
  border-radius: 0 6px 6px 0;
  background: var(--morandi-bg);
}

@media (max-width: 768px) {
  .trips-grid { grid-template-columns: 1fr; }
}
</style>
