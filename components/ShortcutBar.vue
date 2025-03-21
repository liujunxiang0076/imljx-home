<template>
  <Transition
    enter-active-class="animate-slide-up"
    leave-active-class="animate-slide-down"
  >
    <div v-show="show" class="shortcut-bar">
      <el-tooltip
        v-for="(shortcut, index) in shortcuts"
        :key="index"
        :content="shortcut.name"
        placement="top"
        :effect="isDark ? 'dark' : 'light'"
        :offset="12"
      >
        <NuxtLink 
          :to="shortcut.path"
          class="shortcut-item"
          :style="{ '--delay': `${(index * 0.1) + 0.3}s` }"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="shortcut-icon">
            <el-icon>
              <component :is="getIcon(shortcut.iconName)"></component>
            </el-icon>
          </div>
        </NuxtLink>
      </el-tooltip>
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
const isDark = ref(false)
let showTimer = null

// 检测暗色模式
const checkDarkMode = () => {
  isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
}

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
    path: 'https://wx.mail.qq.com/', 
    iconName: 'Message'
  },
  { 
    name: '视频', 
    path: '#', 
    iconName: 'VideoPlay'
  },
  { 
    name: '图库', 
    path: 'https://imgbed.liujunxiang0076.site/', 
    iconName: 'Picture'
  },
])

const startShowProcess = () => {
  showTimer = setTimeout(() => {
    show.value = true
  }, 800)
}

onMounted(() => {
  checkDarkMode()
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', checkDarkMode)
  
  if (document.readyState === 'complete') {
    startShowProcess()
  } else {
    window.addEventListener('load', startShowProcess)
  }
})

onUnmounted(() => {
  if (showTimer) clearTimeout(showTimer)
  window.removeEventListener('load', startShowProcess)
  window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', checkDarkMode)
})
</script>

<style lang="scss" scoped>
.shortcut-bar {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  padding: 0.6rem 1rem;
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
    padding: 0.5rem 0.8rem;
    gap: 0.8rem;
  }

  @media (max-width: 380px) {
    padding: 0.4rem 0.6rem;
    gap: 0.6rem;
  }

  // 适配横屏模式
  @media (max-height: 480px) and (orientation: landscape) {
    bottom: 0.75rem;
  }
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0);
    transition: all 0.3s ease;
  }

  &:hover {
    transform: translateY(-2px);
    
    &::before {
      background: rgba(255, 255, 255, 0.1);
    }
    
    .shortcut-icon {
      transform: scale(1.1);
      background-color: rgba(255, 255, 255, 0.95);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      
      .el-icon {
        color: #409EFF;
      }
    }
  }
  
  &:active {
    transform: translateY(0);
    
    .shortcut-icon {
      transform: scale(0.95);
    }
  }
}

.shortcut-icon {
  width: 2.5rem;
  height: 2.5rem;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
  
  @media (max-width: 640px) {
    width: 2.25rem;
    height: 2.25rem;
  }

  @media (max-width: 380px) {
    width: 2rem;
    height: 2rem;
  }
  
  .el-icon {
    font-size: 1.25rem;
    color: #409EFF;
    transition: all 0.3s ease;

    @media (max-width: 640px) {
      font-size: 1.1rem;
    }

    @media (max-width: 380px) {
      font-size: 1rem;
    }
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
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);

      .el-icon {
        color: #5e9cee;
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
        
        .shortcut-icon {
          transform: scale(1.1);
          background-color: rgba(255, 255, 255, 0.95);
          
          .el-icon {
            color: #409EFF;
          }
        }
      }
    }
  }
}

// 动画相关
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

.animate-slide-up {
  animation: slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.animate-slide-down {
  animation: slideDown 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .shortcut-bar {
    animation-duration: 0.1s;
    .shortcut-item {
      animation-duration: 0.1s;
      transition-duration: 0.1s;
      
      &:hover {
        transform: none;
        
        .shortcut-icon {
          transform: none;
        }
      }
    }
  }
}
</style> 
