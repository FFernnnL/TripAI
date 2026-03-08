<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useItineraryStore } from '../stores/itinerary';
import { useAMap } from '../composables/useAMap';
import { getItinerary, getDayRoute, batchUpdateItems, addItem, deleteItem, createShareLink, regeocode } from '../api/itinerary';
import { getDayColor, TYPE_COLORS } from '../utils/colors';
import { VueDraggable } from 'vue-draggable-plus';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const store = useItineraryStore();
const { initMap, clearAll, addMarker, drawPolyline, parsePolyline, fitView, panTo, loaded } = useAMap('travel-map');

const loading = ref(true);
const savingItems = ref(false);
const shareDialogVisible = ref(false);
const shareUrl = ref('');
const addSpotDialogVisible = ref(false);
const newSpot = ref({ name: '', address: '', type: 'spot', description: '', estimatedMinutes: 60 });

const itineraryId = computed(() => route.params.id as string);
const currentDay = computed(() => store.currentItinerary?.days?.[store.selectedDayIndex] || null);

onMounted(async () => {
  try {
    const res = await getItinerary(itineraryId.value);
    store.setItinerary(res.data);

    // Check if any items/hotels have missing coordinates and trigger re-geocoding
    const hasNullCoords = res.data.days?.some((day: any) =>
      (day.hotelName && (day.hotelLat == null || day.hotelLng == null)) ||
      day.items?.some((item: any) => item.lat == null || item.lng == null)
    );
    if (hasNullCoords) {
      try {
        const geoRes = await regeocode(itineraryId.value);
        if (geoRes.data.updatedCount > 0) {
          // Reload itinerary with updated coordinates
          const refreshed = await getItinerary(itineraryId.value);
          store.setItinerary(refreshed.data);
        }
      } catch {
        // Re-geocoding failure is non-critical
      }
    }
  } catch {
    ElMessage.error('加载行程失败');
  } finally {
    loading.value = false;
  }

  await nextTick();
  await initMap();
});

watch([() => store.selectedDayIndex, () => store.currentItinerary, () => loaded.value], async () => {
  if (!loaded.value || !currentDay.value) return;
  await renderDayOnMap();
}, { immediate: false });

watch(() => loaded.value, async (val) => {
  if (val && currentDay.value) {
    await renderDayOnMap();
  }
});

async function renderDayOnMap() {
  const day = currentDay.value;
  if (!day) return;

  clearAll();
  const dayColor = getDayColor(store.selectedDayIndex);

  // Add hotel marker
  if (day.hotelLat != null && day.hotelLng != null) {
    addMarker({
      position: [day.hotelLng, day.hotelLat],
      label: day.hotelName || '酒店',
      type: 'hotel',
      color: TYPE_COLORS.hotel,
    });
  }

  // Add item markers
  day.items.forEach((item, idx) => {
    if (item.lat != null && item.lng != null) {
      addMarker({
        position: [item.lng, item.lat],
        label: item.name,
        type: item.type,
        color: TYPE_COLORS[item.type] || dayColor,
        index: idx,
        onClick: () => panTo([item.lng!, item.lat!]),
      });
    }
  });

  // Try to get route
  try {
    const res = await getDayRoute(itineraryId.value, day.id);
    if (res.data.routes?.length > 0) {
      for (const segment of res.data.routes) {
        if (segment.polyline) {
          const path = parsePolyline(segment.polyline);
          if (path.length > 1) {
            drawPolyline(path, dayColor);
          }
        }
      }
    }
  } catch {
    // Route loading failure is non-critical
  }

  fitView();
}

function selectDay(index: number) {
  store.setSelectedDay(index);
}

async function handleDragEnd() {
  if (!currentDay.value) return;
  const items = currentDay.value.items.map((item, idx) => ({
    id: item.id,
    orderIndex: idx,
  }));

  savingItems.value = true;
  try {
    await batchUpdateItems(itineraryId.value, currentDay.value.id, items);
    store.markPendingSave();
    // Refresh map
    await renderDayOnMap();
  } catch {
    ElMessage.error('保存排序失败');
  } finally {
    savingItems.value = false;
  }
}

async function handleDeleteItem(itemId: string) {
  try {
    await ElMessageBox.confirm('确定删除该地点吗？', '确认', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' });
    await deleteItem(itineraryId.value, itemId);
    // Refresh
    const res = await getItinerary(itineraryId.value);
    store.setItinerary(res.data);
    ElMessage.success('已删除');
  } catch (err: any) {
    if (err !== 'cancel') ElMessage.error('删除失败');
  }
}

async function handleAddSpot() {
  if (!currentDay.value || !newSpot.value.name) return;
  try {
    await addItem(itineraryId.value, currentDay.value.id, {
      ...newSpot.value,
      type: newSpot.value.type as any,
    });
    const res = await getItinerary(itineraryId.value);
    store.setItinerary(res.data);
    addSpotDialogVisible.value = false;
    newSpot.value = { name: '', address: '', type: 'spot', description: '', estimatedMinutes: 60 };
    ElMessage.success('已添加');
    await renderDayOnMap();
  } catch {
    ElMessage.error('添加失败');
  }
}

async function handleShare() {
  try {
    const res = await createShareLink(itineraryId.value);
    shareUrl.value = `${window.location.origin}/#/share/${res.data.token}`;
    shareDialogVisible.value = true;
  } catch {
    ElMessage.error('生成分享链接失败');
  }
}

function copyShareUrl() {
  navigator.clipboard.writeText(shareUrl.value).then(() => {
    ElMessage.success('链接已复制');
  });
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = { spot: '景点', restaurant: '餐厅', shopping: '购物', entertainment: '娱乐' };
  return labels[type] || type;
}

function getTypeIcon(type: string) {
  const icons: Record<string, string> = {
    spot: 'M12 2C8 2 4 6 4 10c0 6 8 12 8 12s8-6 8-12c0-4-4-8-8-8z',
    restaurant: 'M3 3h2v10H3zM7 3h2v4a4 4 0 004 4V3h2v18h-2v-7a6 6 0 01-6-6V3z',
    shopping: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 01-8 0',
    entertainment: 'M12 2a10 10 0 110 20 10 10 0 010-20zM8 14s1.5 2 4 2 4-2 4-2',
  };
  return icons[type] || icons.spot;
}
</script>

<template>
  <div class="itinerary-page" v-loading="loading">
    <template v-if="store.currentItinerary">
      <!-- Left Panel -->
      <div class="left-panel">
        <div class="panel-header">
          <h2 class="trip-title">{{ store.currentItinerary.title }}</h2>
          <p class="trip-meta">
            {{ store.currentItinerary.startDate }} ~ {{ store.currentItinerary.endDate }} / {{ store.currentItinerary.totalDays }}天
          </p>
        </div>

        <!-- Day Tabs -->
        <div class="day-tabs">
          <button
            v-for="(day, i) in store.currentItinerary.days"
            :key="day.id"
            class="day-tab"
            :class="{ active: store.selectedDayIndex === i }"
            :style="{ '--tab-color': getDayColor(i) }"
            @click="selectDay(i)"
          >
            <span class="tab-day">Day {{ day.dayNumber }}</span>
            <span class="tab-theme">{{ day.theme }}</span>
          </button>
        </div>

        <!-- Day Content -->
        <div v-if="currentDay" class="day-content">
          <!-- Hotel -->
          <div v-if="currentDay.hotelName" class="hotel-card">
            <div class="hotel-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21V7l9-4 9 4v14M9 21v-6h6v6"/></svg>
            </div>
            <div class="hotel-info">
              <h4>{{ currentDay.hotelName }}</h4>
              <p>{{ currentDay.hotelAddress }}</p>
            </div>
          </div>

          <!-- Items (draggable) -->
          <VueDraggable
            v-model="currentDay.items"
            class="items-list"
            handle=".drag-handle"
            animation="200"
            @end="handleDragEnd"
          >
            <div
              v-for="(item, idx) in currentDay.items"
              :key="item.id"
              class="item-card"
            >
              <div class="drag-handle">
                <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/><circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/></svg>
              </div>
              <div class="item-index" :style="{ background: getDayColor(store.selectedDayIndex) }">
                {{ idx + 1 }}
              </div>
              <div class="item-body">
                <div class="item-header">
                  <span class="item-type-badge" :style="{ color: TYPE_COLORS[item.type] || '#999', borderColor: TYPE_COLORS[item.type] || '#ccc' }">
                    {{ getTypeLabel(item.type) }}
                  </span>
                  <span class="item-duration">{{ item.estimatedMinutes }}分钟</span>
                </div>
                <h4 class="item-name" @click="item.lng && item.lat && panTo([item.lng, item.lat])">{{ item.name }}</h4>
                <p v-if="item.description" class="item-desc">{{ item.description }}</p>
                <p v-if="item.address" class="item-address">{{ item.address }}</p>
              </div>
              <button class="item-delete" @click="handleDeleteItem(item.id)" title="删除">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M2 4h12M5.3 4V2.7a.7.7 0 01.7-.7h4a.7.7 0 01.7.7V4M6.7 7.3v4M9.3 7.3v4M3.3 4l.9 9.3a1.3 1.3 0 001.3 1.2h5a1.3 1.3 0 001.3-1.2L12.7 4" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </VueDraggable>

          <!-- Add spot button -->
          <button class="add-spot-btn" @click="addSpotDialogVisible = true">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><path d="M8 3v10M3 8h10" stroke-linecap="round"/></svg>
            添加地点
          </button>

          <!-- Day notes -->
          <div v-if="currentDay.notes" class="day-notes">
            <strong>小贴士:</strong> {{ currentDay.notes }}
          </div>
        </div>

        <!-- Action bar -->
        <div class="action-bar">
          <el-button type="primary" round @click="handleShare">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="margin-right:4px"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" transform="scale(0.65)" stroke-linecap="round" stroke-linejoin="round"/></svg>
            分享行程
          </el-button>
        </div>
      </div>

      <!-- Right Panel: Map -->
      <div class="right-panel">
        <div id="travel-map" class="map-container"></div>
        <!-- Map Legend -->
        <div class="map-legend">
          <div
            v-for="(day, i) in store.currentItinerary.days"
            :key="day.id"
            class="legend-item"
            :class="{ active: store.selectedDayIndex === i }"
            @click="selectDay(i)"
          >
            <span class="legend-color" :style="{ background: getDayColor(i) }"></span>
            <span>Day {{ day.dayNumber }}</span>
          </div>
        </div>
      </div>

      <!-- Share Dialog -->
      <el-dialog v-model="shareDialogVisible" title="分享行程" width="420px">
        <div class="share-content">
          <p style="margin-bottom:12px;color:var(--morandi-text-light)">将以下链接分享给旅伴：</p>
          <div class="share-url-box">
            <input :value="shareUrl" readonly class="share-url-input" />
            <el-button type="primary" size="small" @click="copyShareUrl">复制</el-button>
          </div>
        </div>
      </el-dialog>

      <!-- Add Spot Dialog -->
      <el-dialog v-model="addSpotDialogVisible" title="添加地点" width="440px">
        <div class="add-form">
          <div class="add-form-item">
            <label>名称</label>
            <el-input v-model="newSpot.name" placeholder="地点名称" />
          </div>
          <div class="add-form-item">
            <label>地址</label>
            <el-input v-model="newSpot.address" placeholder="详细地址（选填）" />
          </div>
          <div class="add-form-item">
            <label>类型</label>
            <el-select v-model="newSpot.type" style="width:100%">
              <el-option label="景点" value="spot" />
              <el-option label="餐厅" value="restaurant" />
              <el-option label="购物" value="shopping" />
              <el-option label="娱乐" value="entertainment" />
            </el-select>
          </div>
          <div class="add-form-item">
            <label>推荐理由</label>
            <el-input v-model="newSpot.description" type="textarea" :rows="2" placeholder="简要描述（选填）" />
          </div>
          <div class="add-form-item">
            <label>预计时长（分钟）</label>
            <el-input-number v-model="newSpot.estimatedMinutes" :min="15" :max="480" :step="15" />
          </div>
        </div>
        <template #footer>
          <el-button @click="addSpotDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddSpot" :disabled="!newSpot.name">添加</el-button>
        </template>
      </el-dialog>
    </template>
  </div>
</template>

<style scoped>
.itinerary-page {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.left-panel {
  width: 420px;
  min-width: 380px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--morandi-border-light);
  background: white;
  overflow: hidden;
}
.panel-header {
  padding: 20px 20px 12px;
  border-bottom: 1px solid var(--morandi-border-light);
}
.trip-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--morandi-text);
  margin-bottom: 4px;
}
.trip-meta {
  font-size: 13px;
  color: var(--morandi-text-secondary);
}
.day-tabs {
  display: flex;
  gap: 0;
  padding: 0 16px;
  overflow-x: auto;
  border-bottom: 1px solid var(--morandi-border-light);
  flex-shrink: 0;
}
.day-tab {
  flex-shrink: 0;
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}
.day-tab:hover {
  background: var(--morandi-bg);
}
.day-tab.active {
  border-bottom-color: var(--tab-color);
}
.tab-day {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--morandi-text);
}
.tab-theme {
  display: block;
  font-size: 11px;
  color: var(--morandi-text-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}
.day-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.hotel-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: var(--morandi-bg);
  border-radius: 14px;
  margin-bottom: 16px;
  align-items: center;
}
.hotel-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--morandi-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}
.hotel-icon svg { width: 20px; height: 20px; }
.hotel-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--morandi-text);
}
.hotel-info p {
  font-size: 12px;
  color: var(--morandi-text-secondary);
  margin-top: 2px;
}
.items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.item-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: white;
  border: 1px solid var(--morandi-border-light);
  border-radius: 14px;
  transition: box-shadow 0.2s;
}
.item-card:hover {
  box-shadow: 0 2px 12px var(--morandi-shadow);
}
.drag-handle {
  cursor: grab;
  color: var(--morandi-border);
  padding: 4px;
  margin-top: 2px;
  flex-shrink: 0;
}
.drag-handle:hover { color: var(--morandi-text-secondary); }
.item-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}
.item-body { flex: 1; min-width: 0; }
.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.item-type-badge {
  font-size: 11px;
  padding: 1px 8px;
  border: 1px solid;
  border-radius: 10px;
}
.item-duration {
  font-size: 11px;
  color: var(--morandi-text-secondary);
}
.item-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--morandi-text);
  cursor: pointer;
}
.item-name:hover { color: var(--morandi-primary-dark); }
.item-desc {
  font-size: 12px;
  color: var(--morandi-text-light);
  margin-top: 3px;
  line-height: 1.4;
}
.item-address {
  font-size: 11px;
  color: var(--morandi-text-secondary);
  margin-top: 2px;
}
.item-delete {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--morandi-border);
  padding: 4px;
  border-radius: 6px;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.2s;
}
.item-delete:hover { color: var(--morandi-error); background: #fef0ed; }
.add-spot-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  margin-top: 12px;
  border: 2px dashed var(--morandi-border);
  border-radius: 14px;
  background: transparent;
  color: var(--morandi-text-light);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.add-spot-btn:hover {
  border-color: var(--morandi-primary);
  color: var(--morandi-primary-dark);
  background: var(--morandi-bg);
}
.day-notes {
  margin-top: 16px;
  padding: 12px;
  background: var(--morandi-bg);
  border-radius: 12px;
  font-size: 13px;
  color: var(--morandi-text-light);
  line-height: 1.5;
}
.day-notes strong { color: var(--morandi-text); }
.action-bar {
  padding: 12px 16px;
  border-top: 1px solid var(--morandi-border-light);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}
.right-panel {
  flex: 1;
  position: relative;
}
.map-container {
  width: 100%;
  height: 100%;
}
.map-legend {
  position: absolute;
  top: 16px;
  left: 16px;
  background: white;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  color: var(--morandi-text-light);
  cursor: pointer;
  transition: all 0.2s;
}
.legend-item:hover { background: var(--morandi-bg); }
.legend-item.active {
  background: var(--morandi-bg);
  font-weight: 600;
  color: var(--morandi-text);
}
.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.share-url-box {
  display: flex;
  gap: 8px;
}
.share-url-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--morandi-border);
  border-radius: 8px;
  font-size: 13px;
  color: var(--morandi-text);
  background: var(--morandi-bg);
}
.add-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.add-form-item { display: flex; flex-direction: column; gap: 6px; }
.add-form-item label { font-size: 14px; font-weight: 500; color: var(--morandi-text); }

@media (max-width: 768px) {
  .itinerary-page { flex-direction: column; }
  .left-panel { width: 100%; min-width: auto; max-height: 50vh; }
  .right-panel { height: 50vh; }
}
</style>
