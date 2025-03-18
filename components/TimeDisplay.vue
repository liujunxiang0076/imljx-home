<template>
  <div class="time-display">
    {{ currentTime }}
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const currentTime = ref('')
let timer = null

// 格式化时间
const formatTime = () => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  currentTime.value = `${hours}:${minutes}`
}

// 组件挂载时启动定时器
onMounted(() => {
  formatTime() // 立即执行一次
  timer = setInterval(formatTime, 1000)
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.time-display {
  font-size: 4.5rem;
  font-weight: 300;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin-bottom: 1.5rem;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: 2px;
  opacity: 0.95;
  position: relative;
  z-index: 1;
}
</style> 
