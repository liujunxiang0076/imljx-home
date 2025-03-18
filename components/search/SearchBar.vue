<template>
  <div class="search-container" :style="backgroundStyle">
    <WelcomeToast />
    <div class="loading-overlay" v-if="isLoading">
      <div class="loader"></div>
    </div>
    <div class="search-content">
      <TimeDisplay />
      <div 
        class="search-bar" 
        :class="{ 'expanded': isExpanded }" 
        ref="searchBarRef"
        @mouseenter="expandSearchBar"
        @mouseleave="collapseSearchBar"
      >
        <!-- 使用HeadlessUI的Listbox组件实现搜索引擎选择 -->
        <div class="engine-selector-container">
          <Listbox 
            v-model="selectedEngine" 
            as="div" 
            class="engine-selector" 
            @update:modelValue="handleEngineChange"
          >
            <div class="relative w-full h-full">
              <ListboxButton 
                class="selected-engine" 
                :class="{ 
                  'expanded': isExpanded,
                  'with-bg': isDropdownOpen
                }"
                @click="isEngineClicked = true"
              >
                <div class="engine-button-content">
                  <img 
                    :src="getSelectedEngine().icon" 
                    :alt="getSelectedEngineName()" 
                    class="engine-icon"
                  />
                </div>
              </ListboxButton>
              
              <transition
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
                @before-enter="handleDropdownOpen"
                @after-leave="handleDropdownClose"
              >
                <ListboxOptions class="engine-dropdown">
                  <ListboxOption
                    v-for="engine in searchEngines"
                    :key="engine.name"
                    :value="engine.name"
                    v-slot="{ selected }"
                    as="template"
                    @click="isEngineClicked = false"
                  >
                    <li :class="[
                      'engine-option',
                      selected ? 'selected' : ''
                    ]">
                      <div class="engine-option-content">
                        <img :src="engine.icon" :alt="engine.label" class="engine-icon" />
                        <span>{{ engine.label }}</span>
                      </div>
                      <CheckIcon v-if="selected" class="check-icon" aria-hidden="true" />
                    </li>
                  </ListboxOption>
                </ListboxOptions>
              </transition>
            </div>
          </Listbox>
        </div>
        
        <input 
          v-model="searchQuery" 
          type="text" 
          :placeholder="placeholder"
          @keyup.enter="search"
          @focus="handleFocus"
          @blur="handleBlur"
          :class="{ 'engine-name-transition': engineNameTransition }"
        />
        
        <transition name="fade-slide">
          <button class="search-btn" @click="search" v-if="isExpanded">
            <MagnifyingGlassIcon class="search-icon" aria-hidden="true" />
          </button>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import { ChevronDownIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/vue/20/solid'
import TimeDisplay from '../TimeDisplay.vue'
import { onClickOutside } from '@vueuse/core'
import WelcomeToast from '../WelcomeToast.vue'

// 搜索引擎配置
const searchEngines = [
  { 
    name: 'baidu', 
    label: '百度', 
    url: 'https://www.baidu.com/s?wd=',
    icon: 'https://www.baidu.com/favicon.ico'
  },
  { 
    name: 'google', 
    label: 'Google', 
    url: 'https://www.google.com/search?q=',
    icon: 'https://www.google.com/favicon.ico'
  },
  { 
    name: 'bing', 
    label: 'Bing', 
    url: 'https://www.bing.com/search?q=',
    icon: 'https://www.bing.com/favicon.ico'
  },
  { 
    name: 'duckduckgo', 
    label: 'DuckDuckGo', 
    url: 'https://duckduckgo.com/?q=',
    icon: 'https://duckduckgo.com/favicon.ico'
  }
]

// 响应式状态
const searchQuery = ref('')
const selectedEngine = ref('baidu')
const backgroundImage = ref('')
const imageInfo = ref(null)
const isLoading = ref(true)
const error = ref(null)
const isExpanded = ref(false)
const searchBarRef = ref(null)
const isDropdownOpen = ref(false)
const isEngineClicked = ref(false)
const hasFocus = ref(false)

// 获取当前选择的搜索引擎名称
const getSelectedEngineName = () => {
  const engine = searchEngines.find(engine => engine.name === selectedEngine.value)
  return engine ? engine.label : 'Google'
}

// 获取当前选择的搜索引擎
const getSelectedEngine = () => {
  return searchEngines.find(engine => engine.name === selectedEngine.value) || searchEngines[0]
}

// 背景样式
const backgroundStyle = computed(() => ({
  backgroundImage: backgroundImage.value ? `url(${backgroundImage.value})` : 'none',
  backgroundColor: !backgroundImage.value ? '#f5f5f5' : 'transparent'
}))

// 计算属性：placeholder
const placeholder = computed(() => {
  return isExpanded.value ? `在 ${getSelectedEngineName()} 中搜索...` : '搜索'
})

// 引擎名称动画控制
const engineNameTransition = ref(false)
const prevEngineName = ref(getSelectedEngineName())

// 执行搜索
const search = () => {
  if (!searchQuery.value.trim()) return
  
  const engine = getSelectedEngine()
  const searchUrl = engine.url + encodeURIComponent(searchQuery.value)
  window.open(searchUrl, '_blank')
}

// 展开搜索栏
const expandSearchBar = () => {
  isExpanded.value = true
  // 触发新placeholder的动画
  engineNameTransition.value = true
  setTimeout(() => {
    engineNameTransition.value = false
  }, 300)
}

// 收起搜索栏
const collapseSearchBar = () => {
  // 如果搜索框有内容、下拉菜单打开或有焦点，不收起
  if (searchQuery.value.trim() || isDropdownOpen.value || hasFocus.value) {
    return
  }
  isExpanded.value = false
}

// 处理搜索引擎变更
const handleEngineChange = (newValue) => {
  // 切换搜索引擎时保持展开状态
  isExpanded.value = true
  // 选择后立即关闭下拉菜单状态
  isDropdownOpen.value = false
  // 确保引擎图标背景立即恢复透明
  isEngineClicked.value = false
  
  // 触发引擎名称动画
  prevEngineName.value = getSelectedEngineName()
  engineNameTransition.value = true
  setTimeout(() => {
    engineNameTransition.value = false
  }, 300)
}

// 下拉菜单打开时
const handleDropdownOpen = () => {
  isDropdownOpen.value = true
  isExpanded.value = true
}

// 下拉菜单关闭时
const handleDropdownClose = () => {
  isDropdownOpen.value = false
  // 下拉菜单关闭后，重置点击状态
  isEngineClicked.value = false
}

// 处理焦点
const handleFocus = () => {
  hasFocus.value = true
  isExpanded.value = true
}

const handleBlur = () => {
  hasFocus.value = false
}

// 点击外部时收起搜索栏
onClickOutside(searchBarRef, () => {
  if (isExpanded.value && !isDropdownOpen.value) {
    hasFocus.value = false
    collapseSearchBar()
  }
})

// 获取Bing每日图片
const fetchBingImage = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // 使用服务器API路由
    const response = await fetch('/api/bing-image')
    const data = await response.json()
    
    if (data && data.url) {
      backgroundImage.value = data.url
      imageInfo.value = {
        copyright: data.copyright,
        title: data.title
      }
    } else if (data.error) {
      error.value = data.error
      console.error('获取Bing图片失败:', data.error)
    }
  } catch (error) {
    console.error('获取Bing图片失败:', error)
    error.value = '无法加载背景图片'
  } finally {
    isLoading.value = false
  }
}

// 组件挂载时获取背景图片
onMounted(() => {
  fetchBingImage()
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  // Remove event listeners and clean up resources
})
</script>

<style lang="scss" scoped>
// 变量定义
$search-bar-height: 3rem;
$search-bar-radius: 2rem;
$search-bar-width: 350px;
$search-bar-expanded-width: 750px;
$transition-timing: cubic-bezier(0.4, 0, 0.2, 1);

// Mixins
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin absolute-fill {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

// 动画关键帧
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes placeholderTransition {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 0.8;
    transform: translateY(0);
    color: rgba(0, 0, 0, 0.7);
  }
}

// 主要样式
.search-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: background-image 0.3s ease;

  &::before {
    content: '';
    @include absolute-fill;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0) 25%);
    pointer-events: none;
  }
}

.search-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 15vh;
  z-index: 2;
}

.loading-overlay {
  @include absolute-fill;
  position: fixed;
  background-color: rgba(255, 255, 255, 0.8);
  @include flex-center;
  z-index: 1000;

  .loader {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
}

// 搜索栏样式
.search-bar {
  display: flex;
  align-items: center;
  height: $search-bar-height;
  border-radius: $search-bar-radius;
  background-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s $transition-timing;
  width: $search-bar-width;
  overflow: visible;
  position: relative;
  padding-left: 0.2rem;
  will-change: width, background-color;

  &.expanded {
    width: $search-bar-expanded-width;
    background-color: rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  input {
    flex: 1;
    height: 100%;
    padding: 0 1rem 0 0.5rem;
    border: none;
    font-size: 1.1rem;
    outline: none;
    background-color: transparent;
    transition: all 0.3s $transition-timing;
    opacity: 0.8;
    margin-left: 0.2rem;
    text-align: left;

    &::placeholder {
      transition: all 0.3s $transition-timing;
      opacity: 0.7;
      transform: translateY(0);
      color: rgba(0, 0, 0, 0.6);
    }

    &:focus::placeholder {
      opacity: 0;
      transform: translateY(-20px);
    }

    &.engine-name-transition::placeholder {
      animation: placeholderTransition 0.3s $transition-timing forwards;
    }
  }

  &.expanded input {
    opacity: 1;
    text-align: left;

    &::placeholder {
      opacity: 0.8;
      transform: translateY(0);
      color: rgba(0, 0, 0, 0.7);
    }
  }
}

// 搜索引擎选择器样式
.engine-selector-container {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  margin-right: 0.5rem;
  z-index: 10;
}

.selected-engine {
  @include flex-center;
  height: 40px;
  width: 40px;
  padding: 0;
  margin-left: 0.2rem;
  cursor: pointer;
  background-color: transparent;
  transition: all 0.2s ease;
  border: none;
  border-radius: 50%;

  &:hover,
  &:focus {
    background-color: transparent;
  }

  &:active {
    background-color: rgba(210, 210, 210, 0.9);
  }

  &.with-bg {
    background-color: rgba(230, 230, 230, 0.7);
  }
}

.engine-button-content {
  @include flex-center;
  position: relative;
  width: 100%;
  height: 100%;
}

.engine-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  transition: transform 0.3s ease;

  .expanded & {
    transform: scale(1.1);
  }
}

// 下拉菜单样式
.engine-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  left: 0.5rem;
  width: 150px;
  background-color: white;
  border-radius: 0.8rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin: 0;
  padding: 0;
  list-style: none;
  z-index: 100;
}

.engine-option {
  padding: 0.8rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background-color: rgba(230, 230, 230, 0.7);
  }

  &.selected {
    font-weight: 500;
    color: #4285f4;
  }

  &-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.check-icon {
  width: 1rem;
  height: 1rem;
  color: #4285f4;
}

// 搜索按钮样式
.search-btn {
  width: 3rem;
  height: 100%;
  border: none;
  background-color: transparent;
  color: white;
  @include flex-center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border-top-right-radius: $search-bar-radius;
  border-bottom-right-radius: $search-bar-radius;
  overflow: hidden;

  &::before {
    content: '';
    @include absolute-fill;
    background-color: #4285f4;
    z-index: 0;
    border-top-right-radius: $search-bar-radius;
    border-bottom-right-radius: $search-bar-radius;
    transition: background-color 0.3s ease;
  }

  &:hover::before {
    background-color: #3367d6;
  }
}

.search-icon {
  width: 1.1rem;
  height: 1.1rem;
  position: relative;
  z-index: 1;
}

// 响应式设计
@media (max-width: 768px) {
  .search-content {
    margin-top: 10vh;
    width: 100%;
    padding: 0 1rem;
  }

  .search-bar {
    width: 100%;
    max-width: 320px;

    &.expanded {
      width: 100%;
      max-width: 100%;
    }
  }

  .engine-selector-container {
    margin-right: 0.3rem;
  }

  .selected-engine {
    height: 36px;
    width: 36px;
  }

  .engine-icon {
    width: 20px;
    height: 20px;
  }

  .engine-dropdown {
    width: 140px;
    left: 0.3rem;
  }

  .engine-option {
    padding: 0.7rem 0.8rem;
    font-size: 0.95rem;
  }

  input {
    font-size: 1rem;
    padding: 0 0.8rem 0 0.3rem;
  }

  .search-btn {
    width: 2.8rem;
  }
}

@media (max-width: 480px) {
  .search-content {
    margin-top: 8vh;
  }

  .search-bar {
    height: 2.8rem;
    border-radius: 1.4rem;
  }

  .selected-engine {
    height: 32px;
    width: 32px;
  }

  .engine-icon {
    width: 18px;
    height: 18px;
  }

  input {
    font-size: 0.95rem;
  }

  .search-btn {
    width: 2.5rem;
  }
}

// 添加触摸设备支持
@media (hover: none) {
  .search-bar {
    &:active {
      background-color: rgba(255, 255, 255, 0.95);
    }
  }

  .selected-engine {
    &:active {
      background-color: rgba(230, 230, 230, 0.7);
    }
  }
}

// 添加暗色模式支持
@media (prefers-color-scheme: dark) {
  .search-bar {
    background-color: rgba(30, 30, 30, 0.6);

    &.expanded {
      background-color: rgba(30, 30, 30, 0.95);
    }

    input {
      color: #ffffff;

      &::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }

  .engine-dropdown {
    background-color: #1e1e1e;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .engine-option {
    color: #ffffff;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    &.selected {
      color: #60a5fa;
    }
  }

  .check-icon {
    color: #60a5fa;
  }
}

// 动画类
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style> 
