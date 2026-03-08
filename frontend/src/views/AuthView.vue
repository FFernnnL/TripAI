<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { ElMessage } from 'element-plus';

const auth = useAuthStore();
const router = useRouter();

const isLogin = ref(true);
const loading = ref(false);
const form = ref({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
});

async function handleSubmit() {
  if (!form.value.email || !form.value.password) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  if (!isLogin.value) {
    if (!form.value.username) {
      ElMessage.warning('请填写用户名');
      return;
    }
    if (form.value.password !== form.value.confirmPassword) {
      ElMessage.warning('两次密码不一致');
      return;
    }
  }

  loading.value = true;
  try {
    if (isLogin.value) {
      await auth.login(form.value.email, form.value.password);
    } else {
      await auth.register(form.value.email, form.value.username, form.value.password);
    }
    ElMessage.success(isLogin.value ? '登录成功' : '注册成功');
    const redirect = router.currentRoute.value.query.redirect as string;
    router.push(redirect || '/');
  } catch (err: any) {
    ElMessage.error(err.response?.data?.error || '操作失败');
  } finally {
    loading.value = false;
  }
}

function toggleMode() {
  isLogin.value = !isLogin.value;
  form.value = { email: '', username: '', password: '', confirmPassword: '' };
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <svg class="auth-icon" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" stroke-dasharray="6 3"/>
          <path d="M14 30 L24 14 L34 30" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="24" cy="19" r="3" fill="currentColor"/>
        </svg>
        <h1 class="auth-title">{{ isLogin ? '欢迎回来' : '加入我们' }}</h1>
        <p class="auth-subtitle">{{ isLogin ? '登录您的账户，继续规划旅行' : '创建账户，开始您的旅行规划之旅' }}</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>邮箱</label>
          <el-input v-model="form.email" type="email" placeholder="请输入邮箱" size="large" />
        </div>
        <div v-if="!isLogin" class="form-group">
          <label>用户名</label>
          <el-input v-model="form.username" placeholder="请输入用户名" size="large" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" show-password />
        </div>
        <div v-if="!isLogin" class="form-group">
          <label>确认密码</label>
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" size="large" show-password />
        </div>

        <el-button type="primary" size="large" :loading="loading" native-type="submit" class="submit-btn">
          {{ isLogin ? '登录' : '注册' }}
        </el-button>
      </form>

      <div class="auth-footer">
        <span>{{ isLogin ? '还没有账户？' : '已有账户？' }}</span>
        <a href="#" @click.prevent="toggleMode">{{ isLogin ? '去注册' : '去登录' }}</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, var(--morandi-bg) 0%, #E8E2DB 100%);
}
.auth-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 8px 40px rgba(107, 94, 82, 0.1);
}
.auth-header {
  text-align: center;
  margin-bottom: 32px;
}
.auth-icon {
  width: 56px;
  height: 56px;
  color: var(--morandi-primary);
  margin-bottom: 16px;
}
.auth-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--morandi-text);
  margin-bottom: 8px;
}
.auth-subtitle {
  font-size: 14px;
  color: var(--morandi-text-secondary);
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--morandi-text);
}
.submit-btn {
  width: 100%;
  height: 44px;
  border-radius: 22px !important;
  font-size: 16px;
  margin-top: 8px;
}
.auth-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--morandi-text-light);
}
.auth-footer a {
  color: var(--morandi-primary-dark);
  font-weight: 500;
  margin-left: 4px;
}
</style>
