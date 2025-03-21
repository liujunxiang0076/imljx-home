<template>
  <Transition
    enter-active-class="animate-slide-down"
    leave-active-class="animate-slide-up"
  >
    <div v-show="show" class="welcome-toast">
      {{ greeting }}
    </div>
  </Transition>
</template>

<script setup>

const show = ref(false)
let showTimer = null
let hideTimer = null

// 根据时间计算问候语
const greeting = computed(() => {
  const hour = new Date().getHours()
  
  if (hour >= 0 && hour < 5) {
    return '夜深了，注意休息！'
  } else if (hour >= 5 && hour < 7) {
    return '清晨好！'
  } else if (hour >= 7 && hour < 11) {
    return '上午好！'
  } else if (hour >= 11 && hour < 13) {
    return '中午好！'
  } else if (hour >= 13 && hour < 17) {
    return '下午好！'
  } else if (hour >= 17 && hour < 19) {
    return '傍晚好！'
  } else if (hour >= 19 && hour < 23) {
    return '晚上好！'
  } else {
    return '夜深了，注意休息！'
  }
})

onMounted(() => {
  // 如果页面已经加载完成，直接显示
  if (document.readyState === 'complete') {
    startShowProcess()
  } else {
    // 否则等待页面加载完成
    window.addEventListener('load', startShowProcess)
  }
})

const startShowProcess = () => {
  showTimer = setTimeout(() => {
    show.value = true
    hideTimer = setTimeout(() => {
      show.value = false
    }, 1500)
  }, 500)
}

onUnmounted(() => {
  if (showTimer) clearTimeout(showTimer)
  if (hideTimer) clearTimeout(hideTimer)
  window.removeEventListener('load', startShowProcess)
})
</script>

<style lang="scss" scoped>
// 变量定义
$toast-bg-color: #ffffff;
$toast-text-color: #000000;
$toast-border-radius: 999px;
$toast-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
$toast-animation-duration: 0.4s;

// 关键帧动画
@keyframes slideDown {
  from {
    transform: translate(-50%, -150%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translate(-50%, 0);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -150%);
    opacity: 0;
  }
}

// 样式
.welcome-toast {
  position: fixed;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: $toast-bg-color;
  padding: 0.5rem 1.6rem;
  border-radius: $toast-border-radius;
  font-size: 0.95rem;
  color: $toast-text-color;
  box-shadow: $toast-shadow;
  z-index: 1000;
  font-family: "Microsoft YaHei", -apple-system, sans-serif;
  font-weight: 400;
  letter-spacing: 0.5px;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: $toast-border-radius;
    padding: 1.5px;
    background: linear-gradient(to bottom right, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.03));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}

// 动画类
.animate-slide-down {
  animation: slideDown $toast-animation-duration ease-out forwards;
}

.animate-slide-up {
  animation: slideUp $toast-animation-duration ease-in forwards;
}
</style> 
