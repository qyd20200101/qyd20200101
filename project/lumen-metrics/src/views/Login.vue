<template>
  <div class="login-container">
    <div class="background-decor">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>
    
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <div class="logo-inner"></div>
        </div>
        <h1>LumenMetrics</h1>
        <p>Enterprise SaaS Monitoring Platform</p>
      </div>
      
      <el-form :model="loginForm" class="login-form" @keyup.enter="handleLogin">
        <el-form-item>
          <el-input 
            v-model="loginForm.username" 
            placeholder="Username / Email"
            :prefix-icon="User"
            class="custom-input"
          />
        </el-form-item>
        <el-form-item>
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="Password"
            :prefix-icon="Lock"
            show-password
            class="custom-input"
          />
        </el-form-item>
        
        <div class="form-options">
          <el-checkbox v-model="rememberMe">Remember me</el-checkbox>
          <el-button link type="primary">Forgot Password?</el-button>
        </div>
        
        <el-button 
          type="primary" 
          class="login-submit" 
          :loading="loading"
          @click="handleLogin"
        >
          Sign In
        </el-button>
      </el-form>
      
      <div class="login-footer">
        <span>Don't have an account?</span>
        <el-button link type="primary">Request Access</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '../api/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const rememberMe = ref(true)

const loginForm = reactive({
  username: 'admin@lumen.io',
  password: 'admin123'
})

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('Please enter credentials')
    return
  }
  
  loading.value = true
  try {
    const res = await login(loginForm)
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    ElMessage.success('Welcome back, ' + res.user.username)
    router.push('/')
  } catch (e: any) {
    console.error('Login failed', e)
    // Error message handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0a0a0a;
  overflow: hidden;
  position: relative;
}

/* Background Decorations */
.background-decor {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 0;
}
.circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}
.circle-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #409eff 0%, transparent 70%);
  top: -100px;
  right: -100px;
  animation: float 15s infinite alternate;
}
.circle-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #67c23a 0%, transparent 70%);
  bottom: -150px;
  left: -150px;
  animation: float 20s infinite alternate-reverse;
}

@keyframes float {
  from { transform: translate(0, 0); }
  to { transform: translate(-50px, 50px); }
}

.login-card {
  width: 420px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  z-index: 1;
  text-align: center;
}

.login-header {
  margin-bottom: 40px;
}
.logo {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  border-radius: 16px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-inner {
  width: 30px;
  height: 30px;
  border: 4px solid white;
  border-radius: 50%;
  border-right-color: transparent;
}
h1 {
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}
p {
  color: #a3a6ad;
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}
.custom-input :deep(.el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.2) !important;
  border: 1px solid #333 !important;
  box-shadow: none !important;
  padding: 8px 15px;
  border-radius: 12px;
}
.custom-input :deep(.el-input__wrapper.is-focus) {
  border-color: #409eff !important;
}
.custom-input :deep(.el-input__inner) {
  color: #fff !important;
  height: 40px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.login-submit {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(90deg, #409eff, #337ecc);
  border: none;
  transition: transform 0.2s, box-shadow 0.2s;
}
.login-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(64, 158, 255, 0.4);
}

.login-footer {
  font-size: 14px;
  color: #666;
}
.login-footer .el-button {
  margin-left: 5px;
}
</style>
