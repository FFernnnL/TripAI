<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();

function startPlanning() {
  if (auth.isLoggedIn) {
    router.push('/plan');
  } else {
    router.push('/auth?redirect=/plan');
  }
}
</script>

<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">AI 智能旅行助手</div>
        <h1 class="hero-title">
          让旅行规划<br/>变得<span class="highlight">简单而美好</span>
        </h1>
        <p class="hero-desc">
          告诉我们你的旅行梦想，AI 将为你量身打造完美行程。<br/>
          从目的地到路线，从美食到住宿，一切尽在掌握。
        </p>
        <button class="hero-btn" @click="startPlanning">
          <svg viewBox="0 0 20 20" fill="none" class="btn-icon">
            <path d="M10 3v14M3 10h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          开始规划旅行
        </button>
      </div>
      <div class="hero-decoration">
        <svg viewBox="0 0 300 300" fill="none" class="hero-svg">
          <circle cx="150" cy="150" r="120" stroke="var(--morandi-border)" stroke-width="1" stroke-dasharray="8 4"/>
          <circle cx="150" cy="150" r="80" stroke="var(--morandi-primary-light)" stroke-width="1" stroke-dasharray="6 3"/>
          <circle cx="150" cy="150" r="40" stroke="var(--morandi-primary)" stroke-width="1.5" stroke-dasharray="4 2"/>
          <!-- Landmark dots -->
          <circle cx="90" cy="100" r="6" fill="var(--day-color-1)" opacity="0.8"/>
          <circle cx="200" cy="80" r="5" fill="var(--day-color-2)" opacity="0.8"/>
          <circle cx="180" cy="200" r="7" fill="var(--day-color-3)" opacity="0.8"/>
          <circle cx="100" cy="210" r="5" fill="var(--day-color-4)" opacity="0.8"/>
          <circle cx="150" cy="60" r="4" fill="var(--day-color-5)" opacity="0.8"/>
          <!-- Route lines -->
          <path d="M90 100 Q150 60 200 80 Q220 140 180 200 Q140 230 100 210 Q70 160 90 100" stroke="var(--morandi-primary)" stroke-width="1.5" stroke-dasharray="4 3" fill="none" opacity="0.5"/>
          <!-- Center icon -->
          <path d="M140 155 L150 135 L160 155" stroke="var(--morandi-primary-dark)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="150" cy="142" r="3.5" fill="var(--morandi-primary-dark)"/>
        </svg>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <div class="feature-card">
        <div class="feature-icon" style="background: var(--day-color-1)">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 2C8 2 4 6 4 10c0 6 8 12 8 12s8-6 8-12c0-4-4-8-8-8z" stroke="white" stroke-width="1.5"/><circle cx="12" cy="10" r="2" stroke="white" stroke-width="1.5"/></svg>
        </div>
        <h3>智能目的地推荐</h3>
        <p>AI 理解你的偏好，推荐最适合的景点、美食和住宿</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon" style="background: var(--day-color-2)">
          <svg viewBox="0 0 24 24" fill="none"><path d="M3 12h4l3-9 4 18 3-9h4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <h3>最优路线规划</h3>
        <p>自动生成合理的游览路线，地图可视化展示每日行程</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon" style="background: var(--day-color-4)">
          <svg viewBox="0 0 24 24" fill="none"><path d="M11 4H4v14a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <h3>自由编辑调整</h3>
        <p>拖拽排序、增删景点，实时优化路线，打造专属行程</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon" style="background: var(--day-color-6)">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <h3>一键分享</h3>
        <p>生成分享链接，与旅伴共享你的完美行程规划</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  flex: 1;
  overflow-y: auto;
}
.hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 60px;
  padding: 60px 40px 40px;
  max-width: 1100px;
  margin: 0 auto;
}
.hero-content {
  flex: 1;
  max-width: 500px;
}
.hero-badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 20px;
  background: var(--morandi-bg-hover);
  color: var(--morandi-primary-dark);
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 20px;
  border: 1px solid var(--morandi-border-light);
}
.hero-title {
  font-size: 40px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--morandi-text);
  margin-bottom: 20px;
}
.highlight {
  background: linear-gradient(135deg, var(--morandi-primary-dark), var(--day-color-1));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-desc {
  font-size: 16px;
  line-height: 1.7;
  color: var(--morandi-text-light);
  margin-bottom: 32px;
}
.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  border-radius: 28px;
  background: linear-gradient(135deg, var(--morandi-primary), var(--morandi-primary-dark));
  color: white;
  font-size: 16px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(155, 139, 122, 0.3);
}
.hero-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(155, 139, 122, 0.4);
}
.btn-icon {
  width: 18px;
  height: 18px;
}
.hero-decoration {
  flex-shrink: 0;
}
.hero-svg {
  width: 280px;
  height: 280px;
  animation: float 6s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
.features {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  padding: 40px;
  max-width: 1100px;
  margin: 0 auto;
}
.feature-card {
  background: white;
  border-radius: 20px;
  padding: 28px 24px;
  text-align: center;
  border: 1px solid var(--morandi-border-light);
  transition: all 0.3s;
}
.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px var(--morandi-shadow-hover);
}
.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.feature-icon svg {
  width: 24px;
  height: 24px;
}
.feature-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--morandi-text);
  margin-bottom: 8px;
}
.feature-card p {
  font-size: 13px;
  color: var(--morandi-text-secondary);
  line-height: 1.5;
}
@media (max-width: 768px) {
  .hero { flex-direction: column; gap: 30px; padding: 30px 20px; }
  .hero-title { font-size: 28px; }
  .hero-decoration { display: none; }
  .features { grid-template-columns: repeat(2, 1fr); padding: 20px; gap: 16px; }
}
</style>
