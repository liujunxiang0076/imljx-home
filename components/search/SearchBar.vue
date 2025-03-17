<template>
  <div class="search-container" :style="backgroundStyle">
    <div class="loading-overlay" v-if="isLoading">
      <div class="loader"></div>
    </div>
    
    <div class="search-wrapper" :class="{ 'expanded': isExpanded }">
      <div class="search-bar" 
           ref="searchBarRef"
           @mouseenter="expandSearchBar" 
           @mouseleave="collapseSearchBar"
           :class="{ 'expanded': isExpanded }">
        
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
          @focus="isExpanded = true"
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

// 搜索引擎配置
const searchEngines = [
  { 
    name: 'google', 
    label: 'Google', 
    url: 'https://www.google.com/search?q=',
    icon: 'https://www.google.com/favicon.ico'
  },
  { 
    name: 'baidu', 
    label: '百度', 
    url: 'https://www.baidu.com/s?wd=',
    icon: 'https://www.baidu.com/favicon.ico'
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
const selectedEngine = ref('google')
const backgroundImage = ref('')
const imageInfo = ref(null)
const isLoading = ref(true)
const error = ref(null)
const isExpanded = ref(false)
const searchBarRef = ref(null)
const isDropdownOpen = ref(false)
const isEngineClicked = ref(false)

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
  return isExpanded.value ? `在 ${getSelectedEngineName()} 中搜索...` : ''
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
}

// 收起搜索栏
const collapseSearchBar = () => {
  // 检查搜索框是否为空且没有获得焦点，且下拉菜单未打开
  if (!searchQuery.value.trim() && 
      document.activeElement !== document.querySelector('.search-bar input') && 
      !isDropdownOpen.value) {
    isExpanded.value = false
  }
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

// 点击外部区域时收起搜索栏
const handleClickOutside = (event) => {
  if (searchBarRef.value && !searchBarRef.value.contains(event.target)) {
    if (!searchQuery.value.trim() && !isDropdownOpen.value) {
      isExpanded.value = false
    }
  }
}

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
  document.addEventListener('click', handleClickOutside)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.search-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  transition: background-image 0.5s ease;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.loader {
  width: 48px;
  height: 48px;
  border: 5px solid #4285f4;
  border-bottom-color: transparent;
  border-radius: 50%;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 淡入淡出+滑动动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.search-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.search-wrapper.expanded {
  background-color: transparent;
  border-radius: 1rem;
  box-shadow: none;
  backdrop-filter: none;
  padding: 0;
  max-width: 600px;
  width: 100%;
}

.search-bar {
  display: flex;
  align-items: center;
  height: 3.5rem;
  border-radius: 2rem;
  background-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 300px;
  overflow: visible;
  position: relative;
  padding-left: 0.2rem;
}

.search-bar.expanded {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.engine-selector-container {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  margin-right: 0.5rem;
  z-index: 10;
}

.engine-selector {
  height: 100%;
}

.selected-engine {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  width: 44px;
  padding: 0;
  margin-left: 0.2rem;
  cursor: pointer;
  background-color: transparent;
  transition: all 0.2s ease;
  border: none;
  border-radius: 50%;
}

.selected-engine:hover,
.selected-engine:focus {
  background-color: transparent;
}

.selected-engine:active {
  background-color: rgba(210, 210, 210, 0.9);
}

.engine-button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 100%;
}

.engine-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.expanded .engine-icon {
  transform: scale(1.1);
}

.dropdown-icon {
  width: 0.7rem;
  height: 0.7rem;
  margin-left: 0.2rem;
  color: #666;
  opacity: 0.7;
  transition: transform 0.3s ease;
}

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
}

.engine-option:hover {
  background-color: rgba(230, 230, 230, 0.7);
}

.engine-option.selected {
  font-weight: 500;
  color: #4285f4;
}

.engine-option-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.check-icon {
  width: 1rem;
  height: 1rem;
  color: #4285f4;
}

.search-bar input {
  flex: 1;
  height: 100%;
  padding: 0 1rem 0 0.5rem;
  border: none;
  font-size: 1.1rem;
  outline: none;
  background-color: transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.8;
  margin-left: 0.2rem;
}

.search-bar input::placeholder {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: translateX(-10px);
}

.search-bar.expanded input::placeholder {
  opacity: 1;
  transform: translateX(0);
}

.search-bar input.engine-name-transition::placeholder {
  animation: engineNamePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes engineNamePop {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-bar.expanded input {
  opacity: 1;
}

.search-btn {
  width: 3.5rem;
  height: 100%;
  border: none;
  background-color: transparent;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border-top-right-radius: 2rem;
  border-bottom-right-radius: 2rem;
  overflow: hidden;
}

.search-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #4285f4;
  z-index: 0;
  border-top-right-radius: 2rem;
  border-bottom-right-radius: 2rem;
  transition: background-color 0.3s ease;
}

.search-btn:hover::before {
  background-color: #3367d6;
}

.search-icon {
  width: 1.2rem;
  height: 1.2rem;
  position: relative;
  z-index: 1;
}

.image-credit {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

@media (max-width: 768px) {
  .search-wrapper.expanded {
    width: 90%;
    padding: 0;
  }
  
  .search-bar {
    width: 250px;
  }
  
  .engine-selector {
    min-width: 80px;
  }
}

.selected-engine.with-bg {
  background-color: rgba(230, 230, 230, 0.7);
}
</style> 
