<template>
  <Transition
    enter-active-class="animate-slide-up"
    leave-active-class="animate-slide-down"
  >
    <div v-show="show" class="shortcut-bar">
      <NuxtLink 
        v-for="(shortcut, index) in shortcuts" 
        :key="index" 
        :to="shortcut.path"
        class="shortcut-item"
        :style="{ '--delay': `${(index * 0.1) + 0.3}s` }"
      >
        <div class="shortcut-icon">
          <el-icon>
            <component :is="getIcon(shortcut.iconName)"></component>
          </el-icon>
        </div>
        <div class="shortcut-name">{{ shortcut.name }}</div>
      </NuxtLink>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  Grid, 
  Document, 
  Message, 
  VideoPlay, 
  Picture
} from '@element-plus/icons-vue'

const show = ref(false)
let showTimer = null

const iconMap = {
  Grid,
  Document,
  Message,
  VideoPlay,
  Picture
}

const getIcon = (name) => {
  return iconMap[name]
}

const shortcuts = ref([
  { 
    name: '应用', 
    path: '#', 
    iconName: 'Grid'
  },
  { 
    name: '二维码', 
    path: '/qrcode', 
    iconName: 'Document'
  },
  { 
    name: '邮件', 
    path: '#', 
    iconName: 'Message'
  },
  { 
    name: '视频', 
    path: '#', 
    iconName: 'VideoPlay'
  },
  { 
    name: '图库', 
    path: '#', 
    iconName: 'Picture'
  },
])

const startShowProcess = () => {
  showTimer = setTimeout(() => {
    show.value = true
  }, 800)
}

onMounted(() => {
  if (document.readyState === 'complete') {
    startShowProcess()
  } else {
    window.addEventListener('load', startShowProcess)
  }
})

onUnmounted(() => {
  if (showTimer) clearTimeout(showTimer)
  window.removeEventListener('load', startShowProcess)
})
</script>

<style lang="scss" scoped>
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, 100%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes slideDown {
  from {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  to {
    opacity: 0;
    transform: translate(-50%, 100%);
  }
}

@keyframes iconFadeIn {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.shortcut-bar {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1.5rem;
  padding: 0.8rem 1.5rem;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  max-width: 90vw;
  width: max-content;
  margin: 0 auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1),
              0 2px 4px rgba(0, 0, 0, 0.06),
              inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  z-index: 100;

  @media (max-width: 640px) {
    bottom: 1rem;
    padding: 0.6rem 1rem;
    gap: 1rem;
    border-radius: 0.75rem;
  }

  @media (max-width: 380px) {
    padding: 0.4rem 0.75rem;
    gap: 0.5rem;
  }

  // 适配横屏模式
  @media (max-height: 480px) and (orientation: landscape) {
    bottom: 0.75rem;
    padding: 0.4rem 1rem;
  }

  // 适配深色模式和减弱动效
  @media (prefers-color-scheme: dark) {
    background: rgba(0, 0, 0, 0.2);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2),
                0 2px 4px rgba(0, 0, 0, 0.1),
                inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  }

  @media (prefers-reduced-motion: reduce) {
    animation-duration: 0.1s;
    .shortcut-item {
      animation-duration: 0.1s;
    }
  }
}

.animate-slide-up {
  animation: slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.animate-slide-down {
  animation: slideDown 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0);
    transition: all 0.3s ease;
  }
  
  .icon {
    width: 24px;
    height: 24px;
    color: rgba(255, 255, 255, 0.9);
    position: relative;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    transition: all 0.3s ease;
    will-change: transform;
  }
  
  .label {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    white-space: nowrap;
    font-weight: 400;
  }
  
  &:hover {
    transform: translateY(-2px);
    
    &::before {
      background: rgba(255, 255, 255, 0.1);
    }
    
    .icon {
      color: rgba(255, 255, 255, 1);
      transform: scale(1.1);
      filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));
    }
    
    .label {
      color: rgba(255, 255, 255, 1);
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }
  
  &:active {
    transform: translateY(0);
    
    .icon {
      transform: scale(0.95);
    }
  }
}

.shortcut-icon {
  width: 2.5rem;
  height: 2.5rem;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: scale(1);
  will-change: transform;
  
  @media (max-width: 640px) {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.6rem;
    margin-bottom: 0.35rem;
  }

  @media (max-width: 380px) {
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    margin-bottom: 0.25rem;
  }
  
  .el-icon {
    font-size: 1.5rem;
    color: #409EFF;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    @media (max-width: 640px) {
      font-size: 1.25rem;
    }

    @media (max-width: 380px) {
      font-size: 1.1rem;
    }
  }
}

.shortcut-name {
  font-size: 0.75rem;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: 640px) {
    font-size: 0.7rem;
  }

  @media (max-width: 380px) {
    font-size: 0.65rem;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .shortcut-icon {
    background-color: rgba(44, 44, 44, 0.9);
    
    .el-icon {
      color: #5e9cee;
    }
  }

  .shortcut-item:hover {
    .shortcut-icon {
      background-color: rgba(44, 44, 44, 0.95);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);

      .el-icon {
        color: #5e9cee;
      }
    }
  }

  // 触摸设备的暗色模式点击效果
  @media (hover: none) {
    .shortcut-item:active {
      .shortcut-icon {
        background-color: rgba(44, 44, 44, 0.95);
      }
    }
  }
}

// 触摸设备适配
@media (hover: none) {
  .shortcut-bar {
    .shortcut-item {
      &:active {
        transform: scale(0.95);
        background: rgba(255, 255, 255, 0.15);
        
        .icon {
          transform: scale(1.1);
          color: rgba(255, 255, 255, 1);
        }
        
        .label {
          color: rgba(255, 255, 255, 1);
        }
      }
    }
  }
}
</style> 
