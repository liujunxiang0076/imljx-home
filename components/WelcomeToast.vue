<template>
  <Transition
    enter-active-class="animate-slide-down"
    leave-active-class="animate-slide-up"
  >
    <div v-show="show" class="welcome-toast">
      欢迎回来！
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const show = ref(false)
let showTimer = null
let hideTimer = null

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

<style scoped>
.welcome-toast {
  position: fixed;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ffffff;
  padding: 0.5rem 1.6rem;
  border-radius: 999px;
  font-size: 0.95rem;
  color: #000000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  font-family: "Microsoft YaHei", -apple-system, sans-serif;
  font-weight: 400;
  letter-spacing: 0.5px;
}

.welcome-toast::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 999px;
  padding: 1.5px;
  background: linear-gradient(to bottom right, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.03));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

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

.animate-slide-down {
  animation: slideDown 0.4s ease-out forwards;
}

.animate-slide-up {
  animation: slideUp 0.4s ease-in forwards;
}
</style> 
