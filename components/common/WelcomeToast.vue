// 欢迎提示组件
<template>
  <div class="welcome-toast" v-if="show">
    <div class="welcome-message">{{ welcomeMessage }}</div>
    <div class="close-btn" @click="closeToast">×</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const show = ref(false)
const welcomeMessage = ref('')
let dismissTimer = null

// 根据时间生成欢迎信息
const generateWelcomeMessage = () => {
  const hour = new Date().getHours()
  let timeMessage = ''
  
  if (hour >= 5 && hour < 12) {
    timeMessage = '早上好'
  } else if (hour >= 12 && hour < 14) {
    timeMessage = '中午好'
  } else if (hour >= 14 && hour < 18) {
    timeMessage = '下午好'
  } else if (hour >= 18 && hour < 22) {
    timeMessage = '晚上好'
  } else {
    timeMessage = '夜深了'
  }
  
  welcomeMessage.value = `${timeMessage}`
}

// 关闭提示
const closeToast = () => {
  show.value = false
  clearTimeout(dismissTimer)
  
  // 保存到本地存储，一天内不再显示
  const now = new Date().getTime()
  localStorage.setItem('welcomeToastDismissed', now.toString())
}

onMounted(() => {
  // 检查是否在24小时内已经显示过
  const lastDismissed = localStorage.getItem('welcomeToastDismissed')
  const now = new Date().getTime()
  
  if (lastDismissed && now - parseInt(lastDismissed) < 24 * 60 * 60 * 1000) {
    return
  }
  
  generateWelcomeMessage()
  
  // 延迟显示欢迎信息
  setTimeout(() => {
    show.value = true
    
    // 5秒后自动关闭
    dismissTimer = setTimeout(() => {
      show.value = false
    }, 5000)
  }, 1500)
})

onUnmounted(() => {
  if (dismissTimer) clearTimeout(dismissTimer)
})
</script>

<style lang="scss" scoped>
$bg-color: rgba(255, 255, 255, 0.7);
$text-color: rgba(0, 0, 0, 0.8);
$border-radius: 12px;
$shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

.welcome-toast {
  position: fixed;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: $bg-color;
  padding: 0.8rem 1.2rem;
  border-radius: $border-radius;
  box-shadow: $shadow;
  z-index: 1000;
  display: flex;
  align-items: center;
  backdrop-filter: blur(8px);
  animation: fadeInDown 0.5s ease forwards;
  max-width: 90vw;
  
  @media (max-width: 480px) {
    top: 1rem;
    padding: 0.6rem 1rem;
  }
  
  .welcome-message {
    font-size: 1rem;
    color: $text-color;
    margin-right: 1rem;
    
    @media (max-width: 480px) {
      font-size: 0.9rem;
    }
  }
  
  .close-btn {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $text-color;
    opacity: 0.5;
    transition: opacity 0.2s ease;
    
    &:hover {
      opacity: 0.8;
    }
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

// 暗色模式支持
@media (prefers-color-scheme: dark) {
  .welcome-toast {
    background: rgba(30, 30, 30, 0.8);
    
    .welcome-message {
      color: rgba(255, 255, 255, 0.9);
    }
    
    .close-btn {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}
</style> 
