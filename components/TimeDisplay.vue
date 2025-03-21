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
const greeting = ref('')

// 获取问候语
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) {
    return '早上好'
  } else if (hour >= 12 && hour < 14) {
    return '中午好'
  } else if (hour >= 14 && hour < 18) {
    return '下午好'
  } else if (hour >= 18 && hour < 22) {
    return '晚上好'
  } else {
    return '夜深了'
  }
}

const updateTime = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  currentTime.value = `${hours}:${minutes}`
  greeting.value = getGreeting()
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
    margin-bottom: 0.5rem;
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
  
  .greeting {
    font-size: 1.5rem;
    opacity: 0.9;
    font-weight: 400;
    transform-origin: center;
    
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
