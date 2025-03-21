<template>
  <div class="search-container" :style="backgroundStyle">
    <WelcomeToast />
    <div class="loading-overlay" v-if="isLoading">
      <div class="loader"></div>
    </div>
    <div class="search-content">
      <Transition name="time-display">
        <div class="time-display-wrapper">
          <TimeDisplay />
        </div>
      </Transition>
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
          @input="handleInput"
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

      <!-- 搜索建议下拉列表 -->
      <transition name="suggestion-fade">
        <div class="search-suggestions" v-if="showSuggestions && suggestions.length > 0">
          <div class="suggestion-header">
            <span class="suggestion-title">{{ getSelectedEngineName() }}搜索建议</span>
            <button class="close-suggestions" @click="closeSuggestions">
              <XMarkIcon class="close-icon" aria-hidden="true" />
            </button>
          </div>
          <ul class="suggestion-list">
            <li 
              v-for="(suggestion, index) in suggestions" 
              :key="index"
              @click="selectSuggestion(suggestion)"
              @mouseenter="highlightIndex = index"
              :class="{ 'highlighted': highlightIndex === index }"
            >
              <MagnifyingGlassIcon class="suggestion-icon" aria-hidden="true" />
              <span v-html="highlightMatch(suggestion)"></span>
              <ArrowUpRightIcon 
                class="go-icon" 
                aria-hidden="true" 
                v-if="highlightIndex === index"
              />
            </li>
          </ul>
          <div class="suggestion-footer">
            <span class="keyboard-hint">
              <span class="key-hint">
                <ArrowUpIcon class="arrow-icon" />
                <ArrowDownIcon class="arrow-icon" />
                <span class="key-text">选择</span>
              </span>
              <span class="key-hint">
                <span class="key-box">Enter</span>
                <span class="key-text">确认</span>
              </span>
              <span class="key-hint">
                <span class="key-box">Esc</span>
                <span class="key-text">关闭</span>
              </span>
            </span>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, h, nextTick } from 'vue'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import { 
  ChevronDownIcon, 
  CheckIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  ArrowUpRightIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/vue/20/solid'
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

// 搜索建议相关
const suggestions = ref([])
const showSuggestions = ref(false)
const highlightIndex = ref(-1)
const debounceTimer = ref(null)

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

// 添加时间显示状态控制
const timeDisplayReady = ref(false)

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

// 处理输入，获取搜索建议
const handleInput = () => {
  if (debounceTimer.value) clearTimeout(debounceTimer.value)
  
  // 展开搜索栏
  isExpanded.value = true
  
  // 如果搜索框为空，不显示建议
  if (!searchQuery.value.trim()) {
    showSuggestions.value = false
    suggestions.value = []
    return
  }
  
  // 延迟300ms，减少API请求频率
  debounceTimer.value = setTimeout(() => {
    fetchSuggestions()
  }, 300)
}

// 获取搜索建议
const fetchSuggestions = async () => {
  if (!searchQuery.value.trim()) return
  
  try {
    // 根据当前搜索引擎获取建议API
    const engine = getSelectedEngine()
    
    // 使用服务器端API获取搜索建议
    const response = await fetch(`/api/search-suggestions?query=${encodeURIComponent(searchQuery.value)}&engine=${engine.name}`)
    const data = await response.json()
    
    if (data.success && Array.isArray(data.suggestions)) {
      suggestions.value = data.suggestions
      showSuggestions.value = data.suggestions.length > 0
    } else {
      console.warn('获取搜索建议返回格式错误:', data)
      suggestions.value = []
      showSuggestions.value = false
    }
  } catch (error) {
    console.error('获取搜索建议失败:', error)
    suggestions.value = []
    showSuggestions.value = false
  }
}

// 选择搜索建议
const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion
  search()
}

// 高亮匹配的搜索词
const highlightMatch = (text) => {
  if (!searchQuery.value.trim()) return text
  
  const regex = new RegExp(`(${searchQuery.value})`, 'gi')
  return text.replace(regex, '<strong class="highlight">$1</strong>')
}

// 键盘导航搜索建议
const handleKeyDown = (e) => {
  if (!showSuggestions.value || suggestions.value.length === 0) return
  
  // 向下箭头
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightIndex.value = (highlightIndex.value + 1) % suggestions.value.length
  }
  
  // 向上箭头
  else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightIndex.value = highlightIndex.value <= 0 ? suggestions.value.length - 1 : highlightIndex.value - 1
  }
  
  // 回车键
  else if (e.key === 'Enter' && highlightIndex.value >= 0) {
    e.preventDefault()
    selectSuggestion(suggestions.value[highlightIndex.value])
  }
  
  // Esc键
  else if (e.key === 'Escape') {
    showSuggestions.value = false
  }
}

// 处理焦点
const handleFocus = () => {
  hasFocus.value = true
  isExpanded.value = true
  
  // 如果有输入内容，显示搜索建议
  if (searchQuery.value.trim()) {
    fetchSuggestions()
  }
}

const handleBlur = () => {
  hasFocus.value = false
  
  // 延迟关闭建议，以便可以点击建议
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

// 点击外部时收起搜索栏
onClickOutside(searchBarRef, () => {
  if (isExpanded.value && !isDropdownOpen.value) {
    hasFocus.value = false
    showSuggestions.value = false
    collapseSearchBar()
  }
})

// 获取Bing每日图片
const fetchBingImage = async () => {
  // 如果已经有背景图片，先不显示加载状态
  if (!backgroundImage.value) {
    isLoading.value = true
  }
  error.value = null
  
  try {
    const response = await fetch('/api/bing-image')
    const data = await response.json()
    
    if (data && data.url) {
      // 预加载图片
      const img = new Image()
      img.src = data.url
      img.onload = () => {
        backgroundImage.value = data.url
        imageInfo.value = {
          copyright: data.copyright,
          title: data.title
        }
        isLoading.value = false
      }
      img.onerror = () => {
        error.value = '加载背景图片失败'
        isLoading.value = false
      }
    } else if (data.error) {
      error.value = data.error
      console.error('获取Bing图片失败:', data.error)
      isLoading.value = false
    }
  } catch (error) {
    console.error('获取Bing图片失败:', error)
    error.value = '无法加载背景图片'
    isLoading.value = false
  }
}

// 组件挂载时获取背景图片
onMounted(() => {
  // 立即设置时间显示就绪状态
  timeDisplayReady.value = true
  
  // 如果有缓存的背景图片，先使用缓存
  const cachedImage = localStorage.getItem('backgroundImage')
  const cachedInfo = localStorage.getItem('imageInfo')
  
  if (cachedImage) {
    backgroundImage.value = cachedImage
    if (cachedInfo) {
      imageInfo.value = JSON.parse(cachedInfo)
    }
    isLoading.value = false
  }
  
  // 异步获取新的背景图片
  fetchBingImage().then(() => {
    // 缓存新的背景图片
    if (backgroundImage.value) {
      localStorage.setItem('backgroundImage', backgroundImage.value)
      if (imageInfo.value) {
        localStorage.setItem('imageInfo', JSON.stringify(imageInfo.value))
      }
    }
  })
  
  window.addEventListener('keydown', handleKeyDown)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  if (debounceTimer.value) clearTimeout(debounceTimer.value)
})

// 当搜索引擎改变时，更新搜索建议
watch(selectedEngine, () => {
  if (searchQuery.value.trim()) {
    fetchSuggestions()
  }
})

// 关闭搜索建议
const closeSuggestions = () => {
  showSuggestions.value = false
  highlightIndex.value = -1
}
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
  width: 100%;
  min-height: 120px; // 为时间显示预留固定空间
}

.time-display-wrapper {
  width: 100%;
  height: 60px; // 固定时间显示区域高度
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
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

// 搜索建议样式
.search-suggestions {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.98);
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 50;
  overflow: hidden;
  max-height: 300px;
  display: flex;
  flex-direction: column;
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.suggestion-title {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.close-suggestions {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 1;
  }
  
  .close-icon {
    width: 1rem;
    height: 1rem;
  }
}

.suggestion-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  max-height: 220px;
  
  li {
    padding: 0.8rem 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    position: relative;
    
    &:hover, &.highlighted {
      background-color: rgba(230, 230, 230, 0.7);
    }
    
    &.highlighted {
      padding-right: 2.5rem;
    }
    
    .suggestion-icon {
      width: 1rem;
      height: 1rem;
      color: #9ca3af;
      flex-shrink: 0;
      margin-right: 0.8rem;
    }
    
    .go-icon {
      position: absolute;
      right: 1rem;
      width: 1rem;
      height: 1rem;
      color: #4285f4;
      opacity: 0.8;
    }
    
    .highlight {
      font-weight: 600;
      color: #4285f4;
    }
  }
}

.suggestion-footer {
  padding: 0.6rem 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: flex-end;
}

.keyboard-hint {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 0.75rem;
  color: #666;
  
  .arrow-icon {
    width: 1rem;
    height: 1rem;
    opacity: 0.7;
  }
  
  .key-hint {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  
  .key-box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: #f2f2f2;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0.1rem 0.4rem;
    font-size: 0.7rem;
    font-weight: 500;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    min-width: 1.6rem;
    text-align: center;
  }
  
  .key-text {
    margin-left: 0.1rem;
  }
}

// 搜索建议动画
.suggestion-fade-enter-active,
.suggestion-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: top center;
}

.suggestion-fade-enter-from,
.suggestion-fade-leave-to {
  opacity: 0;
  transform: scaleY(0.9);
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

  .search-suggestions {
    border-radius: 0.8rem;
    
    li {
      padding: 0.7rem 0.8rem;
      font-size: 0.95rem;
    }
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

  .search-suggestions {
    border-radius: 0.7rem;
    
    li {
      padding: 0.6rem 0.7rem;
      font-size: 0.9rem;
      
      .suggestion-icon {
        width: 0.9rem;
        height: 0.9rem;
      }
    }
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

  .search-suggestions {
    background-color: rgba(30, 30, 30, 0.98);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    
    .suggestion-header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      
      .suggestion-title {
        color: #aaa;
      }
    }
    
    .suggestion-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      
      .keyboard-hint {
        color: #aaa;
        
        .key-box {
          background-color: #333;
          border-color: #444;
          color: #eee;
        }
      }
    }
    
    li {
      color: #ffffff;
      
      &:hover, &.highlighted {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      .suggestion-icon {
        color: #9ca3af;
      }
      
      .go-icon {
        color: #60a5fa;
      }
      
      .highlight {
        color: #60a5fa;
      }
    }
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

// 添加时间显示的淡入动画
.time-display-enter-active,
.time-display-leave-active {
  transition: opacity 0.3s ease;
}

.time-display-enter-from,
.time-display-leave-to {
  opacity: 0;
}
</style> 
