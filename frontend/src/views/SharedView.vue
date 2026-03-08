<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getSharedItinerary } from '../api/itinerary';
import { useAMap } from '../composables/useAMap';
import { getDayColor, TYPE_COLORS } from '../utils/colors';
import { ElMessage } from 'element-plus';
import type { Itinerary } from '../types/itinerary';

const route = useRoute();
const loading = ref(true);
const itinerary = ref<Itinerary | null>(null);
const selectedDay = ref(0);
const { initMap, clearAll, addMarker, fitView, loaded } = useAMap('share-map');

const currentDay = computed(() => itinerary.value?.days?.[selectedDay.value] || null);

onMounted(async () => {
  try {
    const res = await getSharedItinerary(route.params.token as string);
    itinerary.value = res.data;
  } catch {
    ElMessage.error('分享链接无效或已过期');
  } finally {
    loading.value = false;
  }

  await nextTick();
  if (itinerary.value) {
    await initMap();
  }
});

watch([() => selectedDay.value, () => loaded.value], () => {
  if (loaded.value && currentDay.value) renderDay();
});

watch(() => loaded.value, (val) => {
  if (val && currentDay.value) renderDay();
});

function renderDay() {
  const day = currentDay.value;
  if (!day) return;
  clearAll();
  const dayColor = getDayColor(selectedDay.value);

  if (day.hotelLat != null && day.hotelLng != null) {
    addMarker({ position: [day.hotelLng, day.hotelLat], label: day.hotelName, type: 'hotel', color: TYPE_COLORS.hotel });
  }
  day.items.forEach((item, idx) => {
    if (item.lat != null && item.lng != null) {
      addMarker({ position: [item.lng, item.lat], label: item.name, type: item.type, color: TYPE_COLORS[item.type] || dayColor, index: idx });
    }
  });
  fitView();
}

function getTypeLabel(type: string) {
  const m: Record<string, string> = { spot: '景点', restaurant: '餐厅', shopping: '购物', entertainment: '娱乐' };
  return m[type] || type;
}
</script>

<template>
  <div class="shared-page" v-loading="loading">
    <template v-if="itinerary">
      <div class="shared-left">
        <div class="shared-header">
          <div class="shared-badge">分享的行程</div>
          <h1>{{ itinerary.title }}</h1>
          <p>{{ itinerary.startDate }} ~ {{ itinerary.endDate }} / {{ itinerary.totalDays }}天</p>
        </div>

        <div class="day-tabs">
          <button
            v-for="(day, i) in itinerary.days"
            :key="day.id"
            class="day-tab"
            :class="{ active: selectedDay === i }"
            :style="{ '--c': getDayColor(i) }"
            @click="selectedDay = i"
          >
            Day {{ day.dayNumber }}: {{ day.theme }}
          </button>
        </div>

        <div v-if="currentDay" class="day-content">
          <div v-if="currentDay.hotelName" class="shared-hotel">
            <strong>住宿:</strong> {{ currentDay.hotelName }}
            <span v-if="currentDay.hotelAddress"> - {{ currentDay.hotelAddress }}</span>
          </div>
          <div v-for="(item, idx) in currentDay.items" :key="item.id" class="shared-item">
            <span class="si-index" :style="{ background: getDayColor(selectedDay) }">{{ idx + 1 }}</span>
            <div class="si-body">
              <div class="si-top">
                <span class="si-type">{{ getTypeLabel(item.type) }}</span>
                <span class="si-dur">{{ item.estimatedMinutes }}min</span>
              </div>
              <h4>{{ item.name }}</h4>
              <p v-if="item.description">{{ item.description }}</p>
            </div>
          </div>
          <div v-if="currentDay.notes" class="shared-notes">{{ currentDay.notes }}</div>
        </div>
      </div>
      <div class="shared-right">
        <div id="share-map" class="map-container"></div>
      </div>
    </template>
    <div v-else-if="!loading" class="error-state">
      <h2>分享链接无效</h2>
      <p>该行程可能已被删除或链接已过期</p>
    </div>
  </div>
</template>

<style scoped>
.shared-page { flex:1; display:flex; overflow:hidden; }
.shared-left { width:400px; overflow-y:auto; background:white; border-right:1px solid var(--morandi-border-light); }
.shared-header { padding:24px 20px 16px; border-bottom:1px solid var(--morandi-border-light); }
.shared-badge { display:inline-block; padding:2px 10px; border-radius:12px; background:var(--morandi-bg); color:var(--morandi-primary-dark); font-size:12px; margin-bottom:8px; }
.shared-header h1 { font-size:20px; font-weight:700; color:var(--morandi-text); margin-bottom:4px; }
.shared-header p { font-size:13px; color:var(--morandi-text-secondary); }
.day-tabs { display:flex; flex-direction:column; gap:2px; padding:8px; border-bottom:1px solid var(--morandi-border-light); }
.day-tab { text-align:left; padding:8px 14px; border:none; background:transparent; border-radius:10px; font-size:13px; color:var(--morandi-text-light); cursor:pointer; border-left:3px solid transparent; }
.day-tab:hover { background:var(--morandi-bg); }
.day-tab.active { background:var(--morandi-bg); border-left-color:var(--c); color:var(--morandi-text); font-weight:500; }
.day-content { padding:16px; }
.shared-hotel { padding:10px 14px; background:var(--morandi-bg); border-radius:10px; font-size:13px; color:var(--morandi-text-light); margin-bottom:14px; }
.shared-hotel strong { color:var(--morandi-text); }
.shared-item { display:flex; gap:10px; padding:10px 0; border-bottom:1px solid var(--morandi-border-light); }
.shared-item:last-child { border-bottom:none; }
.si-index { width:22px; height:22px; border-radius:50%; color:white; font-size:11px; font-weight:600; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; }
.si-body { flex:1; }
.si-top { display:flex; gap:8px; align-items:center; margin-bottom:3px; }
.si-type { font-size:11px; color:var(--morandi-text-secondary); }
.si-dur { font-size:11px; color:var(--morandi-text-secondary); }
.si-body h4 { font-size:14px; font-weight:600; color:var(--morandi-text); }
.si-body p { font-size:12px; color:var(--morandi-text-light); margin-top:2px; }
.shared-notes { margin-top:16px; padding:10px; background:var(--morandi-bg); border-radius:10px; font-size:13px; color:var(--morandi-text-light); }
.shared-right { flex:1; position:relative; }
.map-container { width:100%; height:100%; }
.error-state { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.error-state h2 { font-size:20px; color:var(--morandi-text); margin-bottom:8px; }
.error-state p { color:var(--morandi-text-secondary); }
@media (max-width: 768px) {
  .shared-page { flex-direction:column; }
  .shared-left { width:100%; max-height:50vh; }
  .shared-right { height:50vh; }
}
</style>
