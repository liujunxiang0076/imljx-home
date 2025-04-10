// 二维码生成器组件
<template>
  <div class="qrcode-generator">
    <h1>二维码生成器</h1>
    
    <el-form :model="form" label-position="top">
      <el-form-item label="内容类型">
        <el-radio-group v-model="form.contentType">
          <el-radio label="text">文本</el-radio>
          <el-radio label="url">网址</el-radio>
          <el-radio label="email">邮箱</el-radio>
          <el-radio label="phone">电话</el-radio>
          <el-radio label="sms">短信</el-radio>
          <el-radio label="wifi">WiFi</el-radio>
          <el-radio label="vcard">名片</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 文本 -->
      <div v-if="form.contentType === 'text'">
        <el-form-item label="文本内容">
          <div class="tag-input-container">
            <div class="tags-header">
              <span class="tags-title">历史内容</span>
              <el-button type="text" size="small" class="clear-history" @click="clearAllTags">
                清空历史
              </el-button>
            </div>
            <div class="tags-container">
              <el-tag
                v-for="(tag, index) in tags"
                :key="index"
                :type="tagTypes[index % tagTypes.length]"
                closable
                :effect="selectedTagIndex === index ? 'dark' : 'light'"
                class="tag-item"
                @click="selectTag(index)"
                @close="removeTag(index)"
                @dblclick="startEditTag(index)"
              >
                {{ tag }}
              </el-tag>
            </div>
            <div v-if="isInputVisible" class="tag-input">
              <el-input
                ref="tagInputRef"
                v-model="inputValue"
                size="small"
                @keyup.enter="handleInputConfirm"
                @blur="handleInputConfirm"
                placeholder="输入内容后按回车添加"
              />
            </div>
            <el-button v-else class="button-new-tag" size="small" @click="showInput">
              + 添加内容
            </el-button>
          </div>
        </el-form-item>
      </div>

      <!-- 网址 -->
      <div v-if="form.contentType === 'url'">
        <el-form-item label="网址">
          <el-input
            v-model="form.url"
            placeholder="请输入网址"
            @input="debouncedGenerateQRCode"
          ></el-input>
        </el-form-item>
      </div>

      <!-- 邮箱 -->
      <div v-if="form.contentType === 'email'">
        <el-form-item label="邮箱地址">
          <el-input
            v-model="form.email.address"
            placeholder="请输入邮箱地址"
            @input="debouncedGenerateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="主题">
          <el-input
            v-model="form.email.subject"
            placeholder="请输入邮件主题"
            @input="debouncedGenerateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="form.email.body"
            type="textarea"
            placeholder="请输入邮件内容"
            @input="debouncedGenerateQRCode"
          ></el-input>
        </el-form-item>
      </div>

      <!-- 电话 -->
      <div v-if="form.contentType === 'phone'">
        <el-form-item label="电话号码">
          <el-input
            v-model="form.phone"
            placeholder="请输入电话号码"
            @input="debouncedGenerateQRCode"
          ></el-input>
        </el-form-item>
      </div>

      <!-- 短信 -->
      <div v-if="form.contentType === 'sms'">
        <el-form-item label="手机号码">
          <el-input
            v-model="form.sms.number"
            placeholder="请输入手机号码"
            @input="debouncedGenerateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="短信内容">
          <el-input
            v-model="form.sms.message"
            type="textarea"
            placeholder="请输入短信内容"
            @input="debouncedGenerateQRCode"
          ></el-input>
        </el-form-item>
      </div>

      <!-- WiFi -->
      <div v-if="form.contentType === 'wifi'">
        <el-form-item label="网络名称 (SSID)">
          <el-input
            v-model="form.wifi.ssid"
            placeholder="请输入WiFi名称"
            @input="debouncedGenerateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="加密类型">
          <el-select
            v-model="form.wifi.encryption"
            placeholder="请选择加密类型"
            @change="debouncedGenerateQRCode"
          >
            <el-option label="无" value="nopass"></el-option>
            <el-option label="WPA/WPA2" value="WPA"></el-option>
            <el-option label="WEP" value="WEP"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="密码" v-if="form.wifi.encryption !== 'nopass'">
          <el-input
            v-model="form.wifi.password"
            placeholder="请输入WiFi密码"
            @input="debouncedGenerateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="隐藏网络">
          <el-switch
            v-model="form.wifi.hidden"
            @change="debouncedGenerateQRCode"
          ></el-switch>
        </el-form-item>
      </div>

      <!-- 名片 -->
      <div v-if="form.contentType === 'vcard'">
        <el-form-item label="姓名">
          <el-input
            v-model="form.vcard.name"
            placeholder="请输入姓名"
            @input="debouncedGenerateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="电话">
          <el-input
            v-model="form.vcard.phone"
            placeholder="请输入电话"
            @input="debouncedGenerateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input
            v-model="form.vcard.email"
            placeholder="请输入邮箱"
            @input="debouncedGenerateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="公司">
          <el-input
            v-model="form.vcard.company"
            placeholder="请输入公司"
            @input="debouncedGenerateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="职位">
          <el-input
            v-model="form.vcard.title"
            placeholder="请输入职位"
            @input="debouncedGenerateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="网址">
          <el-input
            v-model="form.vcard.url"
            placeholder="请输入网址"
            @input="debouncedGenerateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="地址">
          <el-input
            v-model="form.vcard.address"
            placeholder="请输入地址"
            @input="debouncedGenerateQRCode"
          ></el-input>
        </el-form-item>
      </div>

      <!-- 颜色、误差校正和尺寸部分布局 -->
      <el-row :gutter="20" class="form-row">
        <el-col :span="12">
          <el-form-item label="二维码颜色">
            <div class="color-row">
              <div class="color-picker-group">
                <span class="color-label">前景</span>
                <el-color-picker
                  v-model="form.foreground"
                  @change="debouncedGenerateQRCode"
                  size="small"
                ></el-color-picker>
              </div>
              <div class="color-picker-group">
                <span class="color-label">背景</span>
                <el-color-picker
                  v-model="form.background"
                  @change="debouncedGenerateQRCode"
                  size="small"
                ></el-color-picker>
              </div>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item label="误差校正级别">
                <el-select
                  v-model="form.errorCorrectionLevel"
                  placeholder="请选择级别"
                  @change="debouncedGenerateQRCode"
                  style="width: 100%"
                >
                  <el-option label="低 (L)" value="L"></el-option>
                  <el-option label="中 (M)" value="M"></el-option>
                  <el-option label="高 (Q)" value="Q"></el-option>
                  <el-option label="最高 (H)" value="H"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="二维码尺寸">
                <el-select
                  v-model="form.size"
                  placeholder="请选择尺寸"
                  @change="debouncedGenerateQRCode"
                  style="width: 100%"
                >
                  <el-option label="小 (150px)" :value="150"></el-option>
                  <el-option label="中 (250px)" :value="250"></el-option>
                  <el-option label="大 (350px)" :value="350"></el-option>
                  <el-option label="最大 (400px)" :value="400"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </el-form>

    <!-- 二维码容器 -->
    <div class="qrcode-container">
      <!-- 二维码显示区域 -->
      <div class="qrcode-wrapper">
        <!-- 添加加载指示器 -->
        <div v-if="isGenerating" class="qrcode-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>正在生成...</span>
        </div>
        <!-- 添加刷新按钮 -->
        <div class="refresh-button" v-if="!isGenerating" @click="forceRefreshQRCode">
          <el-icon><Refresh /></el-icon>
        </div>
        <div ref="qrcodeRef" class="qrcode" :class="{ 'is-generating': isGenerating }"></div>
        <div class="current-text" v-if="form.contentType === 'text' && tags.length > 0">
          <el-tooltip
            effect="dark"
            :content="textLines[selectedTagIndex]"
            placement="top"
            :disabled="!isTextTooLong(textLines[selectedTagIndex])"
          >
            <div class="text-content">
              <span class="label">当前内容:</span> {{ formatLineTooltip(selectedTagIndex) }}
            </div>
          </el-tooltip>
        </div>
      </div>
      <!-- 二维码操作按钮 -->
      <div class="qrcode-actions" v-if="isContentValid">
        <el-button @click="downloadQRCode('png')" type="primary" size="default">
          <el-icon><Download /></el-icon> PNG
        </el-button>
        <el-button @click="downloadQRCode('svg')" type="success" size="default">
          <el-icon><Document /></el-icon> SVG
        </el-button>
        <el-dropdown v-if="form.contentType === 'text' && tags.length > 1">
          <el-button type="warning" size="default">
            <el-icon><Document /></el-icon> 批量下载 <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="batchDownload('png')">下载所有标签 (PNG)</el-dropdown-item>
              <el-dropdown-item @click="batchDownload('svg')">下载所有标签 (SVG)</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed, onUnmounted, nextTick } from 'vue'
import QRCode from 'qrcode'
import { saveAs } from 'file-saver'
import { ArrowDown, Download, Document, Loading, Refresh } from '@element-plus/icons-vue'
import JSZip from 'jszip'
import { ElMessage, ElLoading } from 'element-plus'

// 添加防抖函数
const debounce = (fn, delay) => {
  let timer
  return function(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 添加深度比较函数
const isEqual = (obj1, obj2) => {
  try {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  } catch (e) {
    // 如果序列化失败（例如循环引用），直接返回false以确保更新
    return false;
  }
}

// 本地存储键名
const STORAGE_KEY = 'qrcode_generator_history';

const qrcodeRef = ref(null)
const canvas = ref(null)
const isContentValid = ref(false)
const selectedTagIndex = ref(-1)
const isGenerating = ref(false) // 添加生成状态标志

// 用于缓存的变量
let lastContent = ''
let lastOptions = null

// 标签相关
const tags = ref([])
const tagTypes = ['', 'success', 'warning', 'danger', 'info']
const isInputVisible = ref(false)
const inputValue = ref('')
const tagInputRef = ref(null)

// 从本地存储加载历史记录
const loadTagsFromStorage = () => {
  try {
    const savedTags = localStorage.getItem(STORAGE_KEY);
    if (savedTags) {
      tags.value = JSON.parse(savedTags);
      if (tags.value.length > 0) {
        selectTag(0);
      }
    }
  } catch (error) {
    console.error('加载历史记录失败:', error);
  }
};

// 保存标签到本地存储
const saveTagsToStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tags.value));
  } catch (error) {
    console.error('保存历史记录失败:', error);
  }
};

// 清空所有历史记录
const clearAllTags = () => {
  ElMessage.info('已清空所有历史记录');
  tags.value = [];
  selectedTagIndex.value = -1;
  saveTagsToStorage();
  // 清空二维码显示
  if (qrcodeRef.value) {
    qrcodeRef.value.innerHTML = '';
    canvas.value = null;
  }
};

// 显示输入框
const showInput = () => {
  isInputVisible.value = true
  nextTick(() => {
    tagInputRef.value.focus()
  })
}

// 处理输入确认
const handleInputConfirm = () => {
  if (inputValue.value.trim()) {
    if (editingTagIndex.value !== -1) {
      // 编辑现有标签
      tags.value[editingTagIndex.value] = inputValue.value.trim()
      editingTagIndex.value = -1
    } else {
      // 添加新标签，检查是否已存在
      const newTag = inputValue.value.trim();
      if (!tags.value.includes(newTag)) {
        tags.value.push(newTag)
        // 选择新添加的标签
        selectTag(tags.value.length - 1)
      } else {
        // 如果已存在，选择已有标签
        selectTag(tags.value.findIndex(tag => tag === newTag));
        ElMessage.info('此内容已存在');
      }
    }
    saveTagsToStorage(); // 保存到本地存储
  }
  isInputVisible.value = false
  inputValue.value = ''
}

// 移除标签
const removeTag = (index) => {
  tags.value.splice(index, 1)
  if (selectedTagIndex.value === index) {
    // 如果删除的是当前选中的标签，选择最后一个标签
    selectTag(tags.value.length > 0 ? tags.value.length - 1 : -1)
  } else if (selectedTagIndex.value > index) {
    // 如果删除的标签在选中标签之前，调整选中标签的索引
    selectedTagIndex.value--
  }
  saveTagsToStorage(); // 保存到本地存储
}

// 选择标签
const selectTag = (index) => {
  selectedTagIndex.value = index
  debouncedGenerateQRCode()
}

// 编辑标签
const editingTagIndex = ref(-1)
const startEditTag = (index) => {
  editingTagIndex.value = index
  inputValue.value = tags.value[index]
  isInputVisible.value = true
  nextTick(() => {
    tagInputRef.value.focus()
  })
}

// 更新textLines计算属性，从tags获取内容
const textLines = computed(() => {
  if (form.contentType !== 'text' || tags.value.length === 0) return ['']
  return tags.value
})

// 更新currentLine计算属性
const currentLine = computed(() => {
  if (!textLines.value || textLines.value.length === 0) return ''
  const index = selectedTagIndex.value >= 0 && selectedTagIndex.value < textLines.value.length 
    ? selectedTagIndex.value 
    : 0
  return textLines.value[index] || ''
})

// 格式化行提示
const formatLineTooltip = (val) => {
  if (textLines.value && textLines.value[val]) {
    // 显示前30个字符，如果内容更长则添加...
    const text = textLines.value[val]
    return text.length > 30 ? text.substring(0, 30) + '...' : text
  }
  return val
}

// 判断文本是否过长需要提示
const isTextTooLong = (text) => {
  return text && text.length > 30;
}

// 表单
const form = reactive({
  contentType: 'text',
  text: '',
  url: 'https://',
  email: {
    address: '',
    subject: '',
    body: ''
  },
  phone: '',
  sms: {
    number: '',
    message: ''
  },
  wifi: {
    ssid: '',
    encryption: 'WPA',
    password: '',
    hidden: false
  },
  vcard: {
    name: '',
    phone: '',
    email: '',
    company: '',
    title: '',
    url: '',
    address: ''
  },
  foreground: '#000000',
  background: '#ffffff',
  errorCorrectionLevel: 'M',
  size: 250 // 默认尺寸
})

// 生成内容
const generateContent = () => {
  switch (form.contentType) {
    case 'text':
      if (form.contentType === 'text') {
        if (tags.value.length > 0 && selectedTagIndex.value >= 0) {
          return tags.value[selectedTagIndex.value]
        } else if (tags.value.length > 0) {
          // 如果有标签但没有选中任何标签，使用第一个标签
          return tags.value[0]
        }
        return ''
      }
      return ''
    case 'url':
      return form.url
    case 'email':
      let email = `mailto:${form.email.address}`
      if (form.email.subject) email += `?subject=${encodeURIComponent(form.email.subject)}`
      if (form.email.body) email += `${form.email.subject ? '&' : '?'}body=${encodeURIComponent(form.email.body)}`
      return email
    case 'phone':
      return `tel:${form.phone}`
    case 'sms':
      let sms = `smsto:${form.sms.number}`
      if (form.sms.message) sms += `:${form.sms.message}`
      return sms
    case 'wifi':
      let wifi = `WIFI:T:${form.wifi.encryption};S:${form.wifi.ssid};`
      if (form.wifi.encryption !== 'nopass') wifi += `P:${form.wifi.password};`
      if (form.wifi.hidden) wifi += 'H:true;'
      wifi += ';'
      return wifi
    case 'vcard':
      let vcard = 'BEGIN:VCARD\nVERSION:3.0\n'
      if (form.vcard.name) vcard += `FN:${form.vcard.name}\n`
      if (form.vcard.phone) vcard += `TEL:${form.vcard.phone}\n`
      if (form.vcard.email) vcard += `EMAIL:${form.vcard.email}\n`
      if (form.vcard.company) vcard += `ORG:${form.vcard.company}\n`
      if (form.vcard.title) vcard += `TITLE:${form.vcard.title}\n`
      if (form.vcard.url) vcard += `URL:${form.vcard.url}\n`
      if (form.vcard.address) vcard += `ADR:;;${form.vcard.address};;;\n`
      vcard += 'END:VCARD'
      return vcard
    default:
      return ''
  }
}

// 验证内容
const validateContent = () => {
  const content = generateContent()
  
  if (!content || content.trim() === '') {
    isContentValid.value = false;
    return '';
  }
  
  // 根据不同内容类型验证是否有效
  if (form.contentType === 'text') {
    isContentValid.value = tags.value.length > 0 && selectedTagIndex.value >= 0;
  } else if (form.contentType === 'url') {
    isContentValid.value = form.url && form.url.trim() !== '' && form.url !== 'https://';
  } else if (form.contentType === 'email') {
    isContentValid.value = form.email.address && form.email.address.trim() !== '';
  } else if (form.contentType === 'phone') {
    isContentValid.value = form.phone && form.phone.trim() !== '';
  } else if (form.contentType === 'sms') {
    isContentValid.value = form.sms.number && form.sms.number.trim() !== '';
  } else if (form.contentType === 'wifi') {
    isContentValid.value = form.wifi.ssid && form.wifi.ssid.trim() !== '';
  } else if (form.contentType === 'vcard') {
    isContentValid.value = form.vcard.name && form.vcard.name.trim() !== '';
  } else {
    isContentValid.value = false;
  }
  
  return isContentValid.value ? content : '';
}

// 生成二维码，添加防抖和缓存机制
const generateQRCode = async () => {
  // 如果正在生成，不重复执行
  if (isGenerating.value) return

  const content = validateContent()
  if (!content) {
    // 如果内容无效，清空二维码
    if (qrcodeRef.value) {
      qrcodeRef.value.innerHTML = '';
      canvas.value = null;
    }
    lastContent = '';
    lastOptions = null;
    return;
  }

  // 计算适合的QR码尺寸
  const padding = window.innerWidth <= 768 ? 32 : 80
  const containerWidth = Math.min(window.innerWidth - padding, 600)
  const optimalSize = Math.min(form.size, containerWidth)

  const options = {
    errorCorrectionLevel: form.errorCorrectionLevel,
    margin: 2, // 减少边距
    width: optimalSize,
    color: {
      dark: form.foreground,
      light: form.background
    }
  }

  // 更严格的内容比较
  const contentChanged = content !== lastContent;
  // 对选项进行更直接的比较
  const optionsChanged = !lastOptions || 
                         options.errorCorrectionLevel !== lastOptions.errorCorrectionLevel || 
                         options.width !== lastOptions.width || 
                         options.color.dark !== lastOptions.color.dark || 
                         options.color.light !== lastOptions.color.light;

  // 检查内容和选项是否与上次相同，如果相同则不重新生成
  if (!contentChanged && !optionsChanged) {
    return;
  }

  // 更新缓存前先设置loading状态
  isGenerating.value = true;

  try {
    // 强制在下一个渲染周期更新UI
    await nextTick();
    
    // 更新缓存
    lastContent = content;
    lastOptions = { ...options };

    if (qrcodeRef.value) {
      // 每次都创建新的Canvas以确保完全刷新
      canvas.value = document.createElement('canvas');
      qrcodeRef.value.innerHTML = '';
      qrcodeRef.value.appendChild(canvas.value);
      
      // 生成QR码，使用 Promise 并添加超时处理
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('二维码生成超时'))
        }, 5000)  // 5秒超时
        
        QRCode.toCanvas(canvas.value, content, options, (error) => {
          clearTimeout(timeout)
          if (error) reject(error)
          else resolve()
        })
      });
      
      // 确保生成后反馈给用户
      console.log('QR码已更新:', content.substring(0, 30) + (content.length > 30 ? '...' : ''));
    }
  } catch (error) {
    console.error('生成二维码时出错：', error)
    // 显示错误提示
    ElMessage.error('生成二维码失败，请稍后重试')
    // 清空缓存，确保下次能重新生成
    lastContent = '';
    lastOptions = null;
  } finally {
    isGenerating.value = false; // 重置生成状态
  }
}

// 记录定时器
let resizeTimer = null;

// 创建防抖版本的生成函数，减少延迟时间
const debouncedGenerateQRCode = debounce(generateQRCode, 200);

// 强制刷新二维码的方法，用于用户主动刷新
const forceRefreshQRCode = () => {
  // 清空缓存状态
  lastContent = '';
  lastOptions = null;
  // 直接调用生成函数而不是防抖版本
  generateQRCode();
};

// 清除操作，清理残留的定时器
const cleanup = () => {
  if (resizeTimer) {
    clearTimeout(resizeTimer);
    resizeTimer = null;
  }
};

// 修改窗口大小处理函数，使用防抖
const handleResize = () => {
  // 清除之前的timer
  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }
  
  // 设置新的timer，减少频繁触发
  resizeTimer = setTimeout(() => {
    const currentWidth = window.innerWidth;
    if (Math.abs(currentWidth - lastWindowWidth) > 50) {
      lastWindowWidth = currentWidth;
      // 直接调用非防抖版本，以保证立即响应窗口大小变化
      generateQRCode();
    }
    resizeTimer = null;
  }, 200);
};

// 记录上一次窗口宽度
let lastWindowWidth = window.innerWidth

// 优化观察器，减少不必要的渲染并添加防抖
watch(() => [
  form.contentType,
  selectedTagIndex.value
], () => {
  // 内容类型或当前标签改变时，清空缓存强制重新生成
  lastContent = '';
  lastOptions = null;
  debouncedGenerateQRCode();
}, { immediate: true });

// 深度监听表单变化，使用防抖
watch(() => ({
  url: form.url,
  email: { ...form.email },
  phone: form.phone,
  sms: { ...form.sms },
  wifi: { ...form.wifi },
  vcard: { ...form.vcard },
  foreground: form.foreground,
  background: form.background,
  errorCorrectionLevel: form.errorCorrectionLevel,
  size: form.size
}), () => {
  debouncedGenerateQRCode()
}, { deep: true })

// 生成安全的文件名
const getSafeFileName = (text, maxLength = 50) => {
  // 移除不安全的文件名字符
  let fileName = text.replace(/[\/\\:*?"<>|]/g, '_');
  // 限制长度
  if (fileName.length > maxLength) {
    fileName = fileName.substring(0, maxLength);
  }
  // 确保文件名不为空
  return fileName || 'qrcode';
}
// 下载二维码
const downloadQRCode = async (format) => {
  // 首先确保二维码是最新的
  const content = validateContent()
  if (!content) return

  try {
    // 显示加载提示
    const loadingInstance = ElLoading.service({
      text: `正在准备${format.toUpperCase()}格式二维码...`,
      background: 'rgba(255, 255, 255, 0.7)'
    })

    // 设置更高质量的选项
    const options = {
      errorCorrectionLevel: form.errorCorrectionLevel,
      margin: 2,
      width: Math.max(form.size, 400), // 确保下载的图片足够清晰
      color: {
        dark: form.foreground,
        light: form.background
      }
    }

    try {
      // 使用内容作为文件名
      const fileName = getSafeFileName(content);
      
      if (format === 'png') {
        // 添加超时处理
        const dataUrl = await Promise.race([
          QRCode.toDataURL(content, options),
          new Promise((_, reject) => setTimeout(() => reject(new Error('下载超时')), 10000))
        ])
        saveAs(dataUrl, `${fileName}.png`)
      } else if (format === 'svg') {
        // 添加超时处理
        const svgString = await Promise.race([
          QRCode.toString(content, {
            ...options,
            type: 'svg'
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('下载超时')), 10000))
        ])
        const blob = new Blob([svgString], { type: 'image/svg+xml' })
        saveAs(blob, `${fileName}.svg`)
      }
    } finally {
      loadingInstance.close()
    }
  } catch (error) {
    console.error('下载QR码时出错：', error)
    ElMessage.error('下载二维码失败，请稍后重试')
  }
}

// 批量下载二维码
const batchDownload = async (format) => {
  if (!tags.value || tags.value.length === 0) return
  
  try {
    // 创建新的JSZip实例
    const zip = new JSZip();
    
    // 显示加载提示
    const loadingInstance = ElLoading.service({
      fullscreen: true,
      text: '正在处理二维码，请稍候...'
    })
    
    try {
      // 设置更高质量的选项
      const options = {
        errorCorrectionLevel: form.errorCorrectionLevel,
        margin: 2,
        width: Math.max(form.size, 400), // 确保下载的图片足够清晰
        color: {
          dark: form.foreground,
          light: form.background
        }
      }
      
      // 添加所有二维码到zip文件，使用Promise.all并添加超时处理
      const generatePromises = tags.value.map(async (text, i) => {
        if (!text || !text.trim()) return;
        
        // 使用内容作为文件名
        const fileName = getSafeFileName(text);
        
        try {
          if (format === 'png') {
            // 添加超时处理和错误重试
            let attempts = 0;
            let dataUrl;
            
            while (attempts < 3) {
              try {
                dataUrl = await Promise.race([
                  QRCode.toDataURL(text, options),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('生成超时')), 5000))
                ]);
                break; // 成功后跳出循环
              } catch (err) {
                attempts++;
                if (attempts >= 3) throw err;
                await new Promise(r => setTimeout(r, 1000)); // 等待1秒后重试
              }
            }
            
            // 将base64转换为二进制数据
            const base64Data = dataUrl.split(',')[1];
            zip.file(`${fileName}.png`, base64Data, {base64: true});
          } else if (format === 'svg') {
            // 添加超时处理和错误重试
            let attempts = 0;
            let svgString;
            
            while (attempts < 3) {
              try {
                svgString = await Promise.race([
                  QRCode.toString(text, {
                    ...options,
                    type: 'svg'
                  }),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('生成超时')), 5000))
                ]);
                break; // 成功后跳出循环
              } catch (err) {
                attempts++;
                if (attempts >= 3) throw err;
                await new Promise(r => setTimeout(r, 1000)); // 等待1秒后重试
              }
            }
            
            zip.file(`${fileName}.svg`, svgString);
          }
        } catch (error) {
          console.error(`处理第${i+1}个二维码时出错:`, error);
          // 继续处理其他二维码，不中断整体流程
        }
      });
      
      // 等待所有二维码处理完成
      await Promise.all(generatePromises);
      
      // 生成并下载zip文件
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });
      saveAs(zipBlob, `QR_codes_${new Date().toISOString().slice(0,10)}.zip`);
    } finally {
      // 无论成功失败都关闭加载提示
      loadingInstance.close();
    }
  } catch (error) {
    console.error('批量下载QR码时出错：', error);
    ElMessage.error('批量下载二维码失败，请减少数量后重试');
  }
}

onMounted(() => {
  // 从本地存储加载历史记录
  loadTagsFromStorage();
  
  // 如果有已存在的文本，转换为标签
  if (form.text && tags.value.length === 0) {
    const lines = form.text.split('\n').filter(line => line.trim() !== '')
    if (lines.length > 0) {
      tags.value = lines
      // 选择第一个标签
      selectTag(0)
      // 保存到本地存储
      saveTagsToStorage();
    }
  }
  
  // 初始生成二维码
  generateQRCode()
  
  // 添加带防抖的resize监听器
  window.addEventListener('resize', handleResize)
  lastWindowWidth = window.innerWidth
  
  // 移动设备检测
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    // 移动设备上减小二维码默认尺寸以提高性能
    form.size = Math.min(form.size, 250);
  }
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cleanup();
  
  // 清理定时器
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value);
    debounceTimer.value = null;
  }
  
  // 清除canvas引用
  if (canvas.value) {
    canvas.value = null;
  }
  
  // 释放最后的缓存
  lastContent = null;
  lastOptions = null;
})

// 组件被激活时（如果在keep-alive中）
onActivated && onActivated(() => {
  // 重新生成二维码以确保显示正确
  forceRefreshQRCode();
  // 重新添加事件监听
  window.addEventListener('resize', handleResize);
  lastWindowWidth = window.innerWidth;
});

// 组件被停用时（如果在keep-alive中）
onDeactivated && onDeactivated(() => {
  // 清理资源
  window.removeEventListener('resize', handleResize);
  cleanup();
});

// 表单类型变化时自动保存相关内容
watch(() => form.contentType, (newType, oldType) => {
  if (oldType === 'text') {
    // 离开文本模式时保存标签
    saveTagsToStorage();
  }
});
</script>

<style lang="scss" scoped>
.qrcode-generator {
  max-width: 650px;
  width: 100%;
  margin: 0 auto;
  padding: 1rem 1.5rem 2rem;
  overflow-y: auto;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  
  h1 {
    text-align: center;
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
    color: #303133;
  }
}

.form-row {
  margin-bottom: 0;
}

.color-row {
  display: flex;
  gap: 1.5rem;
  
  .color-picker-group {
    display: flex;
    flex-direction: row;
    align-items: center;
    
    .color-label {
      margin-right: 5px;
      font-size: 0.9rem;
      color: #606266;
    }
  }
}

.text-mode-controls {
  margin-top: 1rem;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 1.25rem;
  background-color: #f8f9fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  .line-selector {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
    
    :deep(.el-pagination) {
      justify-content: center;
      .el-pagination__jump {
        margin-left: 12px;
      }
    }
  }
  
  .line-preview {
    display: inline-block;
    margin: 0.5rem auto;
    padding: 5px 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    text-align: center;
  }
}

.qrcode-container {
  margin-top: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.qrcode-wrapper {
  background-color: #ffffff;
  padding: 0.75rem;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: auto;
  margin: 0 auto;
  overflow: visible;
  transform: translateZ(0);
  position: relative;
  
  .refresh-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: rgba(255, 255, 255, 0.8);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    z-index: 5;
    transition: all 0.2s ease;
    
    &:hover {
      background-color: #f2f6fc;
      transform: rotate(30deg);
    }
    
    .el-icon {
      font-size: 18px;
      color: #409EFF;
    }
  }
  
  .qrcode-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    border-radius: 4px;
    
    .el-icon {
      font-size: 24px;
      color: #409EFF;
      margin-bottom: 8px;
    }
    
    span {
      font-size: 14px;
      color: #606266;
    }
  }
  
  .qrcode {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 0.5rem;
    position: relative;
    min-height: 150px;
    
    &.is-generating {
      opacity: 0.6;
    }
    
    canvas {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border-radius: 4px;
      display: block;
      max-width: 100%;
      transition: all 0.3s ease;
    }
  }
  
  .current-text {
    margin-top: 0.75rem;
    text-align: center;
    color: #606266;
    font-size: 0.9rem;
    padding: 0.5rem;
    background-color: #f8f9fa;
    border-radius: 4px;
    max-width: 100%;
    width: 100%;
    
    .text-content {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
    }
    
    .label {
      color: #909399;
      margin-right: 0.5rem;
      font-weight: 500;
    }
  }
}

.qrcode-actions {
  margin-top: 1.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  
  :deep(.el-button) {
    display: flex;
    align-items: center;
    
    .el-icon {
      margin-right: 4px;
    }
  }
}

@media (max-width: 768px) {
  .qrcode-generator {
    padding: 0.75rem 0.5rem 1.5rem;
    height: auto;
    
    h1 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
  }
  
  .text-mode-controls {
    padding: 0.75rem 0.5rem;
    
    .line-selector {
      :deep(.el-pagination) {
        .el-pagination__jump {
          display: none;
        }
      }
    }
  }
  
  .qrcode-wrapper {
    padding: 0.75rem 0.5rem;
    width: fit-content;
    max-width: 95%;
    
    .qrcode canvas {
      max-width: 100%;
    }
    
    .current-text {
      font-size: 0.8rem;
      padding: 0.4rem;
    }
  }
  
  .qrcode-actions {
    gap: 0.5rem;
    width: 100%;
    
    .el-button {
      flex: 1;
      min-width: 0;
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }
    
    .el-dropdown {
      width: 100%;
      
      .el-button {
        width: 100%;
      }
    }
  }
  
  // 调整滑块在移动端的宽度
  :deep(.el-slider) {
    width: 100%;
  }
  
  .el-row {
    display: flex;
    flex-direction: column;
  }
  
  .color-row {
    justify-content: flex-start;
  }
}

// 当屏幕高度有限时缩小内容间距
@media (max-height: 700px) {
  .qrcode-generator {
    padding-top: 0.75rem;
    
    h1 {
      margin-bottom: 1rem;
    }
  }
  
  .qrcode-container {
    margin-top: 1rem;
  }
  
  .qrcode-wrapper {
    padding: 1rem;
  }
  
  .el-form-item {
    margin-bottom: 0.75rem;
  }
}

.tag-input-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px;
  background-color: #fff;
  min-height: 120px;
  
  .tags-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding: 0 4px;
    
    .tags-title {
      font-size: 14px;
      color: #909399;
      font-weight: 500;
    }
    
    .clear-history {
      font-size: 12px;
      padding: 2px 0;
      color: #F56C6C;
      
      &:hover {
        opacity: 0.8;
      }
    }
  }
  
  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
    
    .tag-item {
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        transform: translateY(-2px);
      }
    }
  }
  
  .tag-input {
    width: 100%;
    margin-bottom: 8px;
  }
  
  .button-new-tag {
    margin-top: 8px;
    align-self: flex-start;
  }
}

/* 全局样式 */
</style>

<style lang="scss">
/* 添加全局样式确保页面可滚动 */
html, body {
  height: 100%;
  overflow-y: auto !important;
  min-height: 100vh;
}

.el-main {
  overflow-y: auto !important;
  padding-bottom: 2rem;
  height: auto;
  min-height: 100vh;
}

.el-container {
  height: auto;
  min-height: 100vh;
}
</style> 
