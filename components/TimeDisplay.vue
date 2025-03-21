<template>
  <Transition name="time-fade">
    <div class="time-display" v-show="mounted">
      <div class="time">{{ currentTime }}</div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const currentTime = ref('')
const mounted = ref(false)

const updateTime = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  currentTime.value = `${hours}:${minutes}`
}

let timeInterval

onMounted(() => {
  updateTime() // 立即更新一次
  timeInterval = setInterval(updateTime, 1000)
  
  // 添加小延迟以确保动画效果
  setTimeout(() => {
    mounted.value = true
  }, 100)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style lang="scss" scoped>
.time-display {
  text-align: center;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transform-origin: center;
  
  .time {
    font-size: 5rem;
    font-weight: 300;
    line-height: 1;
    letter-spacing: -2px;
    
    @media (max-width: 768px) {
      font-size: 4rem;
      letter-spacing: -1px;
    }
    
    @media (max-width: 480px) {
      font-size: 3rem;
      letter-spacing: 0;
    }
  }
}

// 添加时间显示的动画
.time-fade-enter-active {
  transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.time-fade-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.time-fade-leave-active {
  transition: all 0.3s ease;
}

.time-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

// 添加暗色模式支持
@media (prefers-color-scheme: dark) {
  .time-display {
    color: #ffffff;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }
}
</style> 
