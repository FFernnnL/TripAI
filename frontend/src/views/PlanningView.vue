<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useItineraryStore } from '../stores/itinerary';
import { startGeneration } from '../api/ai';
import { ElMessage } from 'element-plus';

const router = useRouter();
const itineraryStore = useItineraryStore();

const form = ref({
  destinations: [] as string[],
  dateRange: [] as string[],
  adults: 2,
  children: 0,
  preferences: '',
});

const destInput = ref('');
const loading = ref(false);

const totalDays = computed(() => {
  if (form.value.dateRange.length !== 2) return 0;
  const start = new Date(form.value.dateRange[0]);
  const end = new Date(form.value.dateRange[1]);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
});

function addDestination() {
  const dest = destInput.value.trim();
  if (!dest) return;
  if (form.value.destinations.includes(dest)) {
    ElMessage.warning('该目的地已添加');
    return;
  }
  form.value.destinations.push(dest);
  destInput.value = '';
}

function removeDestination(index: number) {
  form.value.destinations.splice(index, 1);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault();
    addDestination();
  }
}

async function handleSubmit() {
  if (form.value.destinations.length === 0) {
    ElMessage.warning('请添加至少一个目的地');
    return;
  }
  if (form.value.dateRange.length !== 2) {
    ElMessage.warning('请选择出行日期');
    return;
  }
  if (totalDays.value < 1 || totalDays.value > 30) {
    ElMessage.warning('行程天数需在1-30天之间');
    return;
  }

  loading.value = true;
  itineraryStore.startGenerating();

  // Navigate to generating page first
  router.push('/generating');

  startGeneration(
    {
      destinations: form.value.destinations,
      startDate: form.value.dateRange[0],
      endDate: form.value.dateRange[1],
      totalDays: totalDays.value,
      adults: form.value.adults,
      children: form.value.children,
      preferences: form.value.preferences,
    },
    {
      onStatus: (message, itineraryId) => {
        itineraryStore.setStatus(message);
      },
      onDay: (day) => {
        itineraryStore.addGeneratedDay(day);
      },
      onComplete: (itineraryId) => {
        itineraryStore.finishGenerating();
        router.push(`/itinerary/${itineraryId}`);
      },
      onError: (error) => {
        itineraryStore.finishGenerating();
        ElMessage.error(error);
        router.push('/plan');
      },
    }
  );
}

const popularDestinations = ['北京', '上海', '杭州', '成都', '西安', '厦门', '大理', '丽江', '三亚', '重庆', '苏州', '桂林'];
</script>

<template>
  <div class="planning-page">
    <div class="planning-container">
      <div class="planning-header">
        <h1>规划你的旅行</h1>
        <p>告诉我们你的出行计划，AI 将为你生成完美行程</p>
      </div>

      <form class="planning-form" @submit.prevent="handleSubmit">
        <!-- Destinations -->
        <div class="form-section">
          <label class="section-label">
            <svg viewBox="0 0 20 20" fill="none" class="label-icon"><path d="M10 2C7 2 4 5 4 8c0 5 6 10 6 10s6-5 6-10c0-3-3-6-6-6z" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/></svg>
            目的地
          </label>
          <div class="dest-input-row">
            <el-input
              v-model="destInput"
              placeholder="输入目的地城市，按回车添加"
              size="large"
              @keydown="handleKeydown"
            />
            <el-button type="primary" size="large" @click="addDestination">添加</el-button>
          </div>
          <div v-if="form.destinations.length" class="dest-tags">
            <el-tag
              v-for="(dest, i) in form.destinations"
              :key="i"
              closable
              size="large"
              type="info"
              effect="plain"
              @close="removeDestination(i)"
            >
              {{ dest }}
            </el-tag>
          </div>
          <div class="popular-dests">
            <span class="popular-label">热门:</span>
            <button
              v-for="dest in popularDestinations"
              :key="dest"
              type="button"
              class="popular-btn"
              :class="{ active: form.destinations.includes(dest) }"
              @click="form.destinations.includes(dest) ? null : form.destinations.push(dest)"
            >
              {{ dest }}
            </button>
          </div>
        </div>

        <!-- Date Range -->
        <div class="form-section">
          <label class="section-label">
            <svg viewBox="0 0 20 20" fill="none" class="label-icon"><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 4V2M13 4V2M3 8h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            出行日期
          </label>
          <el-date-picker
            v-model="form.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            size="large"
            style="width: 100%"
          />
          <div v-if="totalDays > 0" class="days-hint">
            共 <strong>{{ totalDays }}</strong> 天行程
          </div>
        </div>

        <!-- Travelers -->
        <div class="form-section">
          <label class="section-label">
            <svg viewBox="0 0 20 20" fill="none" class="label-icon"><circle cx="10" cy="6" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M3 18c0-4 3-7 7-7s7 3 7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            出行人数
          </label>
          <div class="traveler-row">
            <div class="traveler-item">
              <span>成人</span>
              <el-input-number v-model="form.adults" :min="1" :max="20" size="large" />
            </div>
            <div class="traveler-item">
              <span>儿童</span>
              <el-input-number v-model="form.children" :min="0" :max="10" size="large" />
            </div>
          </div>
        </div>

        <!-- Preferences -->
        <div class="form-section">
          <label class="section-label">
            <svg viewBox="0 0 20 20" fill="none" class="label-icon"><path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.3L10 14.5 5.1 17l.9-5.3-4-3.9L7.5 7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
            特殊偏好 <span class="optional">(选填)</span>
          </label>
          <el-input
            v-model="form.preferences"
            type="textarea"
            :rows="4"
            placeholder="描述您的旅行偏好，例如：&#10;- 喜欢自然风光和历史文化&#10;- 希望行程轻松不赶路&#10;- 有老人同行需减少爬山&#10;- 预算中等，住宿干净舒适即可"
            size="large"
          />
        </div>

        <!-- Submit -->
        <el-button
          type="primary"
          size="large"
          native-type="submit"
          :loading="loading"
          class="submit-btn"
        >
          <svg viewBox="0 0 20 20" fill="none" style="width:18px;height:18px;margin-right:6px"><path d="M17 3L3 10l5 2 2 5 7-14z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
          AI 生成行程
        </el-button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.planning-page {
  flex: 1;
  overflow-y: auto;
  padding: 32px 20px 60px;
}
.planning-container {
  max-width: 640px;
  margin: 0 auto;
}
.planning-header {
  text-align: center;
  margin-bottom: 36px;
}
.planning-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--morandi-text);
  margin-bottom: 8px;
}
.planning-header p {
  font-size: 15px;
  color: var(--morandi-text-secondary);
}
.planning-form {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.form-section {
  background: white;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid var(--morandi-border-light);
}
.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--morandi-text);
  margin-bottom: 14px;
}
.label-icon {
  width: 18px;
  height: 18px;
  color: var(--morandi-primary-dark);
}
.optional {
  font-weight: 400;
  color: var(--morandi-text-secondary);
  font-size: 13px;
}
.dest-input-row {
  display: flex;
  gap: 8px;
}
.dest-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.popular-dests {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
  align-items: center;
}
.popular-label {
  font-size: 13px;
  color: var(--morandi-text-secondary);
  margin-right: 4px;
}
.popular-btn {
  padding: 3px 12px;
  border-radius: 14px;
  border: 1px solid var(--morandi-border);
  background: transparent;
  color: var(--morandi-text-light);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.popular-btn:hover {
  border-color: var(--morandi-primary);
  color: var(--morandi-primary-dark);
  background: var(--morandi-bg);
}
.popular-btn.active {
  background: var(--morandi-primary-light);
  border-color: var(--morandi-primary);
  color: white;
  cursor: default;
}
.days-hint {
  margin-top: 10px;
  font-size: 13px;
  color: var(--morandi-primary-dark);
}
.days-hint strong {
  font-size: 18px;
}
.traveler-row {
  display: flex;
  gap: 24px;
}
.traveler-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--morandi-text);
}
.submit-btn {
  width: 100%;
  height: 50px;
  border-radius: 25px !important;
  font-size: 17px;
  font-weight: 500;
  margin-top: 8px;
}
</style>
