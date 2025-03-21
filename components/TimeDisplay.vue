<template>
  <Transition name="time-fade">
    <div class="time-display" v-show="mounted">
      <div class="time">{{ currentTime }}</div>
      <div class="greeting">{{ greeting }}</div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const currentTime = ref('')
const mounted = ref(false)
let timer = null

const updateTime = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  currentTime.value = `${hours}:${minutes}`
}

onMounted(() => {
  // 添加小延迟以确保动画效果
  setTimeout(() => {
    mounted.value = true
  }, 100)
  
  updateTime()
  const timer = setInterval(updateTime, 1000)
  
  onUnmounted(() => {
    clearInterval(timer)
  })
})
</script>

<style lang="scss" scoped>
.time-display {
  text-align: center;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  .time {
    font-size: 5rem;
    font-weight: 300;
    line-height: 1;
    margin-bottom: 0.5rem;
    
    @media (max-width: 768px) {
      font-size: 4rem;
    }
    
    @media (max-width: 480px) {
      font-size: 3rem;
    }
  }
  
  .greeting {
    font-size: 1.5rem;
    opacity: 0.9;
    
    @media (max-width: 768px) {
      font-size: 1.2rem;
    }
    
    @media (max-width: 480px) {
      font-size: 1rem;
    }
  }
}

// 添加时间显示的动画
.time-fade-enter-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.time-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
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
