<template>
  <div class="r2-container">
    <h1>对象存储管理</h1>
    
    <!-- 配置表单 -->
    <div class="config-section">
      <h2>存储配置</h2>
      <div class="config-actions">
        <el-button type="primary" @click="showConfig = true" size="small">
          <el-icon><setting /></el-icon> 设置配置
        </el-button>
        
        <el-tooltip v-if="configSource === 'local'" content="恢复使用环境变量中的配置" placement="top">
          <el-button type="info" @click="resetToEnvConfig" size="small">
            <el-icon><refresh /></el-icon> 重置为环境配置
          </el-button>
        </el-tooltip>
        
        <el-button type="warning" @click="showTips = !showTips" size="small">
          <el-icon><InfoFilled /></el-icon> {{ showTips ? '隐藏排查提示' : '显示排查提示' }}
        </el-button>
      </div>
      
      <div class="config-info">
        <el-tag :type="configSource === 'none' ? 'danger' : configSource === 'local' ? 'success' : 'warning'">
          {{ configSourceText }}
        </el-tag>
      </div>
      
      <el-dialog
        v-model="showConfig"
        title="对象存储配置"
        width="90%"
        :max-width="500"
        top="5vh"
        :fullscreen="screenWidth < 600"
        align-center
        destroy-on-close
      >
        <el-form :model="config" label-width="120px" label-position="top">
          <el-form-item label="Access Key ID">
            <el-input v-model="config.accessKeyId" :placeholder="r2AccessKeyId || '请输入Access Key ID'" show-password />
          </el-form-item>
          <el-form-item label="Secret Key">
            <el-input v-model="config.secretKey" :placeholder="r2SecretKey ? '******' : '请输入Secret Key'" show-password />
          </el-form-item>
          <el-form-item label="存储桶名称">
            <el-input v-model="config.bucketName" :placeholder="r2BucketName || '请输入存储桶名称'" />
          </el-form-item>
          <el-form-item label="终端节点">
            <el-input v-model="config.endpoint" :placeholder="r2Endpoint || '请输入终端节点地址 (例如: https://xxx.r2.cloudflarestorage.com)'" />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showConfig = false">取消</el-button>
            <el-button type="primary" @click="saveConfig">保存配置</el-button>
            <el-button type="success" @click="testConnection">测试连接</el-button>
          </div>
        </template>
      </el-dialog>

      <div class="connection-status" v-if="connectionTested">
        <el-alert
          :title="connectionSuccess ? '连接成功' : '连接失败'"
          :type="connectionSuccess ? 'success' : 'error'"
          :description="connectionMessage"
          show-icon
          :closable="false"
        />
      </div>
      
      <!-- 网络问题排查建议 -->
      <div class="troubleshooting-tips" v-if="showTips">
        <el-collapse>
          <el-collapse-item title="连接问题排查建议" name="1">
            <div class="tips-content">
              <h4>ECONNRESET (连接重置)错误解决方案：</h4>
              <ol>
                <li>检查终端节点URL格式是否正确，应为 <code>https://&lt;账户ID&gt;.r2.cloudflarestorage.com</code> 或其他对象存储厂商提供的地址</li>
                <li>确认您的网络环境允许HTTPS连接到存储服务器，无代理或防火墙限制</li>
                <li>如果使用公司或学校网络，可能存在网络策略限制，尝试使用其他网络连接</li>
                <li>如果使用VPN，尝试禁用后重新连接</li>
                <li>尝试清除浏览器缓存后重新测试</li>
              </ol>
              
              <h4>签名验证失败错误解决方案：</h4>
              <ol>
                <li>确保Access Key ID和Secret Key完全正确，复制时不要包含额外空格</li>
                <li>Secret Key必须与Access Key ID配对，不能混用不同账户的凭证</li>
                <li>检查存储桶名称是否正确</li>
              </ol>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
    
    <!-- 文件列表 -->
    <div class="files-section">
      <div class="files-header">
        <div class="path-navigation">
          <h2>文件列表</h2>
          <div class="file-actions-main">
            <el-button type="primary" @click="showUploadDialog" size="small" :disabled="!hasR2Config">
              <el-icon><upload-filled /></el-icon> 上传文件
            </el-button>
            <el-button type="success" @click="showCreateFolderDialog" size="small" :disabled="!hasR2Config">
              <el-icon><folder-add /></el-icon> 创建目录
            </el-button>
            <el-button type="info" @click="refreshFileList" :loading="loading" size="small">
              <el-icon><refresh /></el-icon> 刷新
            </el-button>
          </div>
          <div class="breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item @click="navigateToRoot">根目录</el-breadcrumb-item>
              <el-breadcrumb-item 
                v-for="(folder, index) in currentPathParts" 
                :key="index"
                @click="navigateToPath(index)"
              >
                {{ folder }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
        </div>
      </div>
      
      <div v-if="!hasR2Config" class="no-config-tip">
        <el-alert
          title="未配置存储"
          type="warning"
          description="请先完成对象存储配置后再使用文件管理功能"
          show-icon
          :closable="false"
        >
          <template #default>
            <el-button type="primary" size="small" @click="showConfig = true" style="margin-top: 10px;">
              <el-icon><setting /></el-icon> 立即配置
            </el-button>
          </template>
        </el-alert>
      </div>
      
      <el-table 
        v-loading="loading" 
        :data="paginatedFiles" 
        style="width: 100%" 
        empty-text="没有文件"
        :default-sort="{prop: 'LastModified', order: 'descending'}"
        class="file-table"
        size="small"
      >
        <el-table-column prop="Type" label="" width="50">
          <template #default="scope">
            <el-icon v-if="scope.row.Type === 'folder'"><folder /></el-icon>
            <el-icon v-else><document /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="Key" label="文件名" min-width="180">
          <template #default="scope">
            <el-tooltip v-if="scope.row.Type !== 'folder' && isNameTooLong(getFileName(scope.row.Key))" effect="dark" :content="getFileName(scope.row.Key)" placement="top">
              <span 
                class="file-name" 
                :class="{ 'folder-name': scope.row.Type === 'folder' }" 
                @click="scope.row.Type === 'folder' ? openFolder(scope.row.Key) : null"
              >
                {{ getFileName(scope.row.Key) }}
              </span>
            </el-tooltip>
            <span 
              v-else
              class="file-name" 
              :class="{ 'folder-name': scope.row.Type === 'folder' }" 
              @click="scope.row.Type === 'folder' ? openFolder(scope.row.Key) : null"
            >
              {{ getFileName(scope.row.Key) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="FileType" label="格式" min-width="80" :visible="screenWidth >= 480">
          <template #default="scope">
            <span v-if="scope.row.Type === 'folder'">文件夹</span>
            <span v-else>{{ getFileExtension(scope.row.Key) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="Size" label="大小" min-width="100" :visible="screenWidth >= 576">
          <template #default="scope">
            <span v-if="scope.row.Type === 'folder'">-</span>
            <span v-else>{{ formatFileSize(scope.row.Size) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="LastModified" label="最后修改时间" min-width="180" sortable :visible="screenWidth >= 768">
          <template #default="scope">
            <span v-if="scope.row.Type === 'folder'">-</span>
            <span v-else>{{ formatDate(scope.row.LastModified) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="120" width="160">
          <template #default="scope">
            <div class="action-buttons">
              <el-button v-if="scope.row.Type === 'folder'" size="small" type="primary" @click="openFolder(scope.row.Key)">打开</el-button>
              <el-button v-else-if="isImage(scope.row.Key)" size="small" type="success" @click="previewImage(scope.row.Key)">预览</el-button>
              <el-button v-else size="small" type="primary" @click="downloadFile(scope.row.Key)">下载</el-button>
              <el-button size="small" type="danger" @click="confirmDelete(scope.row.Key, scope.row.Type)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页控件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, prev, pager, next, sizes"
          :total="processFileList(files).length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        />
      </div>
      
      <!-- 移动端文件信息补充显示 -->
      <div v-if="screenWidth < 768 && paginatedFiles.length > 0" class="mobile-file-info">
        <el-collapse accordion>
          <el-collapse-item v-for="(file, index) in paginatedFiles" :key="file.Key" :title="getFileName(file.Key)" :name="index">
            <div class="mobile-file-details">
              <p v-if="file.Type === 'folder'"><strong>类型:</strong> 文件夹</p>
              <template v-else>
                <p><strong>格式:</strong> {{ getFileExtension(file.Key) }}</p>
                <p><strong>大小:</strong> {{ formatFileSize(file.Size) }}</p>
                <p><strong>上传时间:</strong> {{ formatDate(file.LastModified) }}</p>
              </template>
              <div class="mobile-actions">
                <el-button v-if="file.Type === 'folder'" size="small" type="primary" @click="openFolder(file.Key)">打开</el-button>
                <el-button v-else-if="isImage(file.Key)" size="small" type="success" @click="previewImage(file.Key)">预览</el-button>
                <el-button v-else size="small" type="primary" @click="downloadFile(file.Key)">下载</el-button>
                <el-button size="small" type="danger" @click="confirmDelete(file.Key, file.Type)">删除</el-button>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>

    <!-- 上传文件对话框 -->
    <el-dialog
      v-model="showUpload"
      title="上传文件"
      width="90%"
      :max-width="500"
      top="5vh"
      :fullscreen="screenWidth < 600"
      align-center
      destroy-on-close
    >
      <div class="upload-container">
        <el-upload
          class="upload"
          drag
          :http-request="uploadFile"
          :show-file-list="false"
          :limit="1"
          accept="*/*"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              将上传到当前文件夹: <strong>{{ currentPath || '根目录' }}</strong>
            </div>
          </template>
        </el-upload>
        
        <div v-if="uploading" class="upload-progress">
          <el-progress :percentage="uploadProgress" />
          <p class="upload-status">{{ uploadStatusText }}</p>
        </div>
      </div>
    </el-dialog>
    
    <!-- 创建文件夹对话框 -->
    <el-dialog
      v-model="showCreateFolder"
      title="创建目录"
      width="90%"
      :max-width="500"
      top="20vh"
      align-center
      destroy-on-close
    >
      <el-form>
        <el-form-item label="目录名称">
          <el-input v-model="folderToCreate" placeholder="请输入目录名称" />
        </el-form-item>
        <div class="folder-location-tip">
          将在当前位置创建: <strong>{{ currentPath ? currentPath + '/' : '' }}{{ folderToCreate || '新目录' }}</strong>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCreateFolder = false">取消</el-button>
          <el-button type="primary" @click="createFolder" :disabled="!folderToCreate.trim()">创建</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 图片预览 -->
    <div style="display: none;">
      <el-image
        v-if="previewImageUrl"
        ref="previewImageRef"
        :src="previewImageUrl"
        :preview-src-list="imagePreviewList"
        :initial-index="currentImageIndex"
        hide-on-click-modal
        fit="scale-down"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount, nextTick, h } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ElImageViewer } from 'element-plus';
import { UploadFilled, Setting, Refresh, InfoFilled, Folder, Document, Warning, FolderAdd, ZoomOut, ZoomIn, ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import type { UploadRequestOptions } from 'element-plus';
import dayjs from 'dayjs';
import { useHead } from 'nuxt/app';

// 设置页面标题和图标
useHead({
  title: '对象存储管理',
  meta: [
    { name: 'description', content: '对象存储文件管理界面' }
  ],
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico'
    }
  ]
});

// 状态管理
const files = ref<any[]>([]);
const loading = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadStatusText = ref('');
const showConfig = ref(false);
const connectionTested = ref(false);
const connectionSuccess = ref(false);
const connectionMessage = ref('');
const configSource = ref<'local' | 'env' | 'none'>('none');
const showTips = ref(true); // 默认显示排查建议

// 文件夹导航相关
const currentPath = ref('');
const currentPathParts = computed(() => {
  return currentPath.value ? currentPath.value.split('/').filter(Boolean) : [];
});

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);

// 响应式设计 - 屏幕宽度监测
const screenWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200);

// 检查是否存在R2配置
const hasR2Config = computed(() => {
  return !!(r2AccessKeyId.value && r2SecretKey.value && r2BucketName.value && r2Endpoint.value);
});

// 处理文件列表，添加文件和文件夹区分
const processFileList = (objects: any[]): any[] => {
  const result: any[] = [];
  const prefixes = new Set<string>();
  
  // 处理当前路径
  const prefix = currentPath.value ? `${currentPath.value}/` : '';
  
  // 首先识别当前目录下的所有文件和子文件夹
  objects.forEach(obj => {
    // 如果不是以当前路径开头，则跳过
    if (!obj.Key.startsWith(prefix)) return;
    
    // 去掉前缀
    const relativePath = obj.Key.substring(prefix.length);
    
    // 如果包含斜杠，说明是子目录中的文件，提取第一级子目录
    if (relativePath.includes('/')) {
      const folderName = relativePath.split('/')[0];
      const folderPath = prefix + folderName;
      
      // 添加到前缀集合中
      prefixes.add(folderPath);
    } else if (relativePath) {
      // 这是当前目录的文件，直接添加
      result.push({
        ...obj,
        Type: 'file'
      });
    }
  });
  
  // 添加文件夹
  prefixes.forEach(folderPath => {
    result.push({
      Key: folderPath,
      Type: 'folder',
      Size: 0,
      LastModified: null
    });
  });
  
  return result;
};

// 分页后的文件列表
const paginatedFiles = computed(() => {
  const processedFiles = processFileList(files.value);
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return processedFiles.slice(startIndex, endIndex);
});

// 处理分页大小变化
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  // 重新计算总页数，如果当前页超出范围，重置为第一页
  const totalPages = Math.ceil(processFileList(files.value).length / pageSize.value);
  if (currentPage.value > totalPages) {
    currentPage.value = 1;
  }
};

// 处理当前页变化
const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage;
};

const updateScreenWidth = () => {
  screenWidth.value = window.innerWidth;
};

// R2配置
const r2AccessKeyId = ref('');
const r2SecretKey = ref('');
const r2BucketName = ref('');
const r2Endpoint = ref('');

// 表单配置
const config = ref({
  accessKeyId: '',
  secretKey: '',
  bucketName: '',
  endpoint: ''
});

// 图片预览相关
const showImagePreview = ref(false);
const previewImageUrl = ref('');
const previewFileName = ref('');
const currentPreviewFile = ref('');
const imageLoading = ref(false);
const imageLoadError = ref(false);
const imageZoom = ref(1);
const imageFiles = ref<string[]>([]);
const imagePreviewList = ref<string[]>([]);
const currentImageIndex = ref(0);
const previewImageRef = ref<InstanceType<typeof import('element-plus').ElImage>>();

// 文件夹操作相关
const folderToCreate = ref('');

// 对话框控制
const showUpload = ref(false);
const showCreateFolder = ref(false);

// 监听键盘事件处理图片导航
const setupKeyboardNavigation = () => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (!showImagePreview.value) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        showPreviousImage();
        break;
      case 'ArrowRight':
        showNextImage();
        break;
      case 'Escape':
        showImagePreview.value = false;
        break;
      case '+':
      case '=':
        zoomIn();
        break;
      case '-':
        zoomOut();
        break;
      case '0':
        resetZoom();
        break;
    }
  };
  
  window.addEventListener('keydown', handleKeydown);
  return () => {
    window.removeEventListener('keydown', handleKeydown);
  };
};

// 页面加载时获取文件列表并尝试加载本地存储的配置
onMounted(() => {
  loadStoredConfig();
  if (!r2AccessKeyId.value || !r2SecretKey.value || !r2BucketName.value || !r2Endpoint.value) {
    // 如果没有配置，尝试从服务端获取默认配置
    loadDefaultConfig();
  } else {
    refreshFileList();
  }
  
  // 添加屏幕宽度监听
  window.addEventListener('resize', updateScreenWidth);
  
  // 添加键盘导航监听
  const removeKeyListener = setupKeyboardNavigation();
  
  // 确保页面可以滚动
  document.body.style.overflow = 'auto';
  document.body.style.height = 'auto';
  document.documentElement.style.overflow = 'auto';
  document.documentElement.style.height = 'auto';
  
  // 确保页面初始化后滚动到顶部
  window.scrollTo(0, 0);
  
  onBeforeUnmount(() => {
    // 移除屏幕宽度监听
    window.removeEventListener('resize', updateScreenWidth);
    // 移除键盘导航监听
    removeKeyListener();
  });
});

// 从服务端获取默认配置
const loadDefaultConfig = async () => {
  try {
    const response = await fetch('/api/r2?action=getDefaultConfig', {
      method: 'GET'
    });
    
    const data = await response.json();
    
    if (data.success && data.config.hasConfig) {
      r2AccessKeyId.value = data.config.accessKeyId || '';
      // 这里使用完整的密钥，但前端显示时会被掩码
      r2SecretKey.value = data.config.secretKey || '';
      r2BucketName.value = data.config.bucketName || '';
      r2Endpoint.value = data.config.endpoint || '';
      
      // 更新表单值，显示掩码后的密钥
      config.value = {
        accessKeyId: r2AccessKeyId.value,
        secretKey: data.config.secretKey,  // 掩码后的密钥
        bucketName: r2BucketName.value,
        endpoint: r2Endpoint.value
      };
      
      // 记录配置来源
      configSource.value = 'env';
      
      // 如果成功获取配置，则刷新文件列表
      ElMessage.success('已加载环境变量中的R2配置');
      refreshFileList();
    } else {
      ElMessage.warning('未找到环境变量中的R2配置，请手动设置');
      configSource.value = 'none';
    }
  } catch (error) {
    console.error('获取默认配置失败:', error);
    ElMessage.error('获取环境变量配置失败');
    configSource.value = 'none';
  }
};

// 加载存储的配置
const loadStoredConfig = () => {
  const storedConfig = localStorage.getItem('r2Config');
  if (storedConfig) {
    try {
      const parsedConfig = JSON.parse(storedConfig);
      r2AccessKeyId.value = parsedConfig.accessKeyId || '';
      r2SecretKey.value = parsedConfig.secretKey || '';
      r2BucketName.value = parsedConfig.bucketName || '';
      r2Endpoint.value = parsedConfig.endpoint || '';
      
      // 将存储的配置显示在表单中，密钥用星号表示
      config.value = {
        accessKeyId: r2AccessKeyId.value,
        secretKey: '',  // 出于安全考虑，不回显密钥
        bucketName: r2BucketName.value,
        endpoint: r2Endpoint.value
      };
      
      // 记录配置来源
      configSource.value = 'local';
      
      return true;
    } catch (error) {
      console.error('加载存储的配置失败:', error);
      return false;
    }
  }
  return false;
};

// 保存配置
const saveConfig = () => {
  // 只有当输入不为空时才更新对应的值
  if (config.value.accessKeyId) r2AccessKeyId.value = config.value.accessKeyId;
  if (config.value.secretKey && !config.value.secretKey.includes('*')) {
    // 只有当密钥不包含星号时才更新（表示用户输入了新密钥）
    r2SecretKey.value = config.value.secretKey;
  }
  if (config.value.bucketName) r2BucketName.value = config.value.bucketName;
  if (config.value.endpoint) r2Endpoint.value = config.value.endpoint;
  
  // 存储配置到本地存储
  const configToStore = {
    accessKeyId: r2AccessKeyId.value,
    secretKey: r2SecretKey.value,
    bucketName: r2BucketName.value,
    endpoint: r2Endpoint.value
  };
  localStorage.setItem('r2Config', JSON.stringify(configToStore));
  
  // 记录配置来源为本地
  configSource.value = 'local';
  
  ElMessage.success('配置已保存');
  showConfig.value = false;
  
  // 使用新配置刷新文件列表
  refreshFileList();
};

// 配置来源文本
const configSourceText = computed(() => {
  switch (configSource.value) {
    case 'local':
      return '当前使用：浏览器本地存储的配置';
    case 'env':
      return '当前使用：环境变量中的配置';
    case 'none':
      return '尚未配置';
    default:
      return '';
  }
});

// 测试连接
const testConnection = async () => {
  connectionTested.value = true;
  connectionSuccess.value = false;
  connectionMessage.value = '测试连接中...';
  
  try {
    // 收集当前配置
    const testConfig = {
      accessKeyId: config.value.accessKeyId || r2AccessKeyId.value,
      secretKey: config.value.secretKey || r2SecretKey.value,
      bucketName: config.value.bucketName || r2BucketName.value,
      endpoint: config.value.endpoint || r2Endpoint.value
    };
    
    // 发送测试请求
    const response = await fetch('/api/r2?action=testConnection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testConfig),
    });
    
    const data = await response.json();
    
    if (data.success) {
      connectionSuccess.value = true;
      connectionMessage.value = `成功连接到存储桶 "${testConfig.bucketName}"`;
    } else {
      connectionSuccess.value = false;
      connectionMessage.value = data.error || '连接失败';
    }
  } catch (error: any) {
    connectionSuccess.value = false;
    connectionMessage.value = error.message || '连接测试过程中出错';
  }
};

// 刷新文件列表
const refreshFileList = async () => {
  loading.value = true;
  try {
    // 检查是否有配置
    if (!r2AccessKeyId.value || !r2SecretKey.value || !r2BucketName.value || !r2Endpoint.value) {
      ElMessage.warning('请先配置R2存储');
      files.value = [];
      loading.value = false;
      return;
    }
    
    const response = await fetch(`/api/r2?action=list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessKeyId: r2AccessKeyId.value,
        secretKey: r2SecretKey.value,
        bucketName: r2BucketName.value,
        endpoint: r2Endpoint.value,
        prefix: currentPath.value
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      files.value = data.objects || [];
      // 重置到第一页
      currentPage.value = 1;
    } else {
      // 显示诊断信息
      let errorMessage = data.error || '获取文件列表失败';
      if (data.errorCode) {
        errorMessage += ` (错误代码: ${data.errorCode})`;
      }
      ElMessage.error({
        message: errorMessage,
        duration: 5000
      });
      files.value = [];
    }
  } catch (error: any) {
    ElMessage.error({
      message: `获取文件列表失败: ${error.message}`,
      duration: 5000
    });
    files.value = [];
  } finally {
    loading.value = false;
  }
};

// 上传文件
const uploadFile = async (options: UploadRequestOptions) => {
  if (!hasR2Config.value) {
    ElMessage.warning('请先完成对象存储配置后再上传文件');
    return;
  }
  
  const file = options.file;
  
  try {
    uploading.value = true;
    uploadProgress.value = 0;
    uploadStatusText.value = '准备上传...';
    
    // 构建文件名
    let fileName = file.name;
    if (currentPath.value) {
      fileName = `${currentPath.value}/${fileName}`;
    }
    
    console.log(`上传文件: ${fileName}, 类型: ${file.type}, 大小: ${formatFileSize(file.size)}`);
    
    // 获取预签名上传URL
    uploadStatusText.value = '获取上传链接...';
    const response = await fetch('/api/r2?action=getUploadUrl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        fileName,
        contentType: file.type || 'application/octet-stream',
        accessKeyId: r2AccessKeyId.value,
        secretKey: r2SecretKey.value,
        bucketName: r2BucketName.value,
        endpoint: r2Endpoint.value
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '获取上传链接失败');
    }
    
    // 上传到预签名URL
    uploadStatusText.value = '正在上传...';
    
    // 使用XMLHttpRequest以支持进度监控
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          uploadProgress.value = percentComplete;
          uploadStatusText.value = `上传中... ${percentComplete}%`;
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`上传失败: ${xhr.status} ${xhr.statusText}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('上传过程中发生网络错误'));
      });
      
      xhr.addEventListener('abort', () => {
        reject(new Error('上传已取消'));
      });
      
      xhr.open('PUT', data.uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    });
    
    // 上传成功
    uploadProgress.value = 100;
    uploadStatusText.value = '上传成功!';
    ElMessage.success(`文件 ${file.name} 上传成功`);
    
    // 刷新文件列表
    await refreshFileList();
    
    // 延迟关闭上传状态
    setTimeout(() => {
      uploading.value = false;
      showUpload.value = false; // 关闭上传对话框
    }, 1000);
  } catch (error: any) {
    console.error('上传文件失败:', error);
    uploadProgress.value = 0;
    uploadStatusText.value = `上传失败: ${error.message}`;
    ElMessage.error({
      message: `上传失败: ${error.message}`,
      duration: 5000
    });
    setTimeout(() => {
      uploading.value = false;
    }, 3000);
  }
};

// 下载文件
const downloadFile = async (fileName: string) => {
  try {
    const response = await fetch('/api/r2?action=getDownloadUrl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        fileName,
        accessKeyId: r2AccessKeyId.value,
        secretKey: r2SecretKey.value,
        bucketName: r2BucketName.value,
        endpoint: r2Endpoint.value
      }),
    });
    
    const data = await response.json();
    
    if (data.success && data.downloadUrl) {
      // 创建一个临时链接并模拟点击下载
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      ElMessage.error(data.error || '获取下载链接失败');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '下载失败');
  }
};

// 确认删除文件
const confirmDelete = (path: string, type: string) => {
  const isFolder = type === 'folder';
  const typeName = isFolder ? '文件夹' : '文件';
  const fileName = getFileName(path);
  
  ElMessageBox.confirm(
    `确定要删除${typeName} "${fileName}" 吗?` + (isFolder ? '文件夹内的所有文件也将被删除！' : ''),
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    deleteFile(path, type);
  }).catch(() => {
    // 用户取消操作
  });
};

// 删除文件/文件夹
const deleteFile = async (path: string, type: string) => {
  try {
    const isFolder = type === 'folder';
    const action = isFolder ? 'deleteFolder' : 'delete';
    
    const response = await fetch(`/api/r2?action=${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        fileName: path,
        accessKeyId: r2AccessKeyId.value,
        secretKey: r2SecretKey.value,
        bucketName: r2BucketName.value,
        endpoint: r2Endpoint.value
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      ElMessage.success(`${isFolder ? '文件夹' : '文件'}删除成功`);
      await refreshFileList();
    } else {
      ElMessage.error(data.error || `删除${isFolder ? '文件夹' : '文件'}失败`);
    }
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败');
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

// 重置为环境变量中的配置
const resetToEnvConfig = async () => {
  // 移除本地存储的配置
  localStorage.removeItem('r2Config');
  
  // 从环境变量中重新加载配置
  await loadDefaultConfig();
  
  ElMessage.success('已重置为环境变量中的配置');
};

// 获取文件扩展名
const getFileExtension = (fileName: string) => {
  if (!fileName) return '';
  const parts = fileName.split('.');
  if (parts.length === 1) return '无扩展名';
  
  const extension = parts[parts.length - 1].toUpperCase();
  return extension;
};

// 获取文件名
const getFileName = (key: string) => {
  if (!key) return '';
  const parts = key.split('/');
  return parts[parts.length - 1] || key;
};

// 导航到根目录
const navigateToRoot = () => {
  currentPath.value = '';
  refreshFileList();
};

// 导航到指定路径层级
const navigateToPath = (index: number) => {
  if (index < 0) {
    navigateToRoot();
    return;
  }
  
  const parts = currentPathParts.value;
  const newPath = parts.slice(0, index + 1).join('/');
  currentPath.value = newPath;
  refreshFileList();
};

// 打开文件夹
const openFolder = (folderPath: string) => {
  currentPath.value = folderPath;
  refreshFileList();
};

// 判断文件是否为图片
const isImage = (fileName: string) => {
  if (!fileName) return false;
  const extension = getFileExtension(fileName).toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension.toLowerCase());
};

// 预览图片
const previewImage = async (fileName: string) => {
  try {
    loading.value = true;
    currentPreviewFile.value = fileName;
    
    // 加载所有图片文件
    await loadImageFiles();
    
    // 获取当前预览图片URL
    const response = await fetch('/api/r2?action=getDownloadUrl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        fileName,
        accessKeyId: r2AccessKeyId.value,
        secretKey: r2SecretKey.value,
        bucketName: r2BucketName.value,
        endpoint: r2Endpoint.value
      }),
    });
    
    const data = await response.json();
    
    if (data.success && data.downloadUrl) {
      previewImageUrl.value = data.downloadUrl;
      // 建立预览图片列表
      imagePreviewList.value = await Promise.all(
        imageFiles.value.map(async (imgFile) => {
          const imgResponse = await fetch('/api/r2?action=getDownloadUrl', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              fileName: imgFile,
              accessKeyId: r2AccessKeyId.value,
              secretKey: r2SecretKey.value,
              bucketName: r2BucketName.value,
              endpoint: r2Endpoint.value
            }),
          });
          
          const imgData = await imgResponse.json();
          return imgData.success ? imgData.downloadUrl : '';
        })
      );
      
      // 过滤掉空URL
      imagePreviewList.value = imagePreviewList.value.filter(url => url);
      
      // 设置当前图片在列表中的索引
      const index = imageFiles.value.findIndex(file => file === fileName);
      if (index !== -1) {
        currentImageIndex.value = index;
      }
      
      // 使用Element Plus直接创建图片预览器
      const { createVNode, render } = await import('vue');
      
      // 创建容器
      const container = document.createElement('div');
      
      // 创建图片预览组件的虚拟节点
      const vnode = createVNode(ElImageViewer, {
        urlList: imagePreviewList.value,
        initialIndex: currentImageIndex.value,
        zIndex: 3000,
        onClose: () => {
          // 清理DOM - 使用render函数清空容器
          render(null, container);
          // 只有当容器还在DOM中时才移除它
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        }
      });
      
      // 渲染到容器
      render(vnode, container);
      
      // 将容器添加到body
      document.body.appendChild(container);
      
    } else {
      ElMessage.error(data.error || '获取图片预览链接失败');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '预览图片失败');
  } finally {
    loading.value = false;
  }
};

// 加载当前文件夹所有图片文件列表
const loadImageFiles = async () => {
  try {
    const processedFiles = processFileList(files.value);
    imageFiles.value = processedFiles
      .filter(file => file.Type === 'file' && isImage(file.Key))
      .map(file => file.Key);
  } catch (error) {
    console.error('加载图片文件列表失败:', error);
    imageFiles.value = [];
  }
};

// 显示上一个图片
const showPreviousImage = () => {
  if (imageFiles.value.length <= 1 || currentImageIndex.value <= 0) return;
  
  currentImageIndex.value--;
  previewImage(imageFiles.value[currentImageIndex.value]);
};

// 显示下一个图片
const showNextImage = () => {
  if (imageFiles.value.length <= 1 || currentImageIndex.value >= imageFiles.value.length - 1) return;
  
  currentImageIndex.value++;
  previewImage(imageFiles.value[currentImageIndex.value]);
};

// 处理图片加载错误
const handleImageError = () => {
  imageLoadError.value = true;
  imageLoading.value = false;
  ElMessage.error('图片加载失败，可能是格式不兼容或链接已过期');
};

// 显示上传文件对话框
const showUploadDialog = () => {
  if (!hasR2Config.value) {
    ElMessage.warning('请先配置对象存储后再上传文件');
    return;
  }
  showUpload.value = true;
};

// 显示创建文件夹对话框
const showCreateFolderDialog = () => {
  if (!hasR2Config.value) {
    ElMessage.warning('请先配置对象存储后再创建文件夹');
    return;
  }
  folderToCreate.value = '';
  showCreateFolder.value = true;
};

// 创建文件夹
const createFolder = async () => {
  if (!folderToCreate.value.trim()) {
    ElMessage.warning('请输入文件夹名称');
    return;
  }

  // 验证文件夹名称 - 不允许特殊字符
  const invalidChars = /[<>:"/\\|?*]/g;
  if (invalidChars.test(folderToCreate.value)) {
    ElMessage.error('文件夹名称不能包含以下字符: < > : " / \\ | ? *');
    return;
  }

  try {
    loading.value = true;
    
    // 构建文件夹路径
    let folderPath = folderToCreate.value.trim();
    if (currentPath.value) {
      folderPath = `${currentPath.value}/${folderPath}`;
    }
    
    console.log('正在创建文件夹:', folderPath);
    
    // 使用服务器端API创建文件夹，而不是直接使用预签名URL
    const response = await fetch('/api/r2?action=createFolder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderPath: folderPath,
        accessKeyId: r2AccessKeyId.value,
        secretKey: r2SecretKey.value,
        bucketName: r2BucketName.value,
        endpoint: r2Endpoint.value
      }),
    });
    
    const data = await response.json();
    console.log('创建文件夹响应:', data);
    
    if (!data.success) {
      throw new Error(data.error || '创建文件夹失败');
    }
    
    console.log('文件夹创建成功');
    ElMessage.success(`文件夹 "${folderToCreate.value}" 创建成功`);
    folderToCreate.value = '';
    showCreateFolder.value = false; // 关闭对话框
    await refreshFileList();
  } catch (error: any) {
    console.error('创建文件夹错误:', error);
    ElMessage.error({
      message: `创建文件夹失败: ${error.message}`,
      duration: 5000
    });
  } finally {
    loading.value = false;
  }
};

// 放大图片
const zoomIn = () => {
  imageZoom.value += 0.1;
};

// 缩小图片
const zoomOut = () => {
  imageZoom.value -= 0.1;
};

// 重置图片缩放
const resetZoom = () => {
  imageZoom.value = 1;
};

// 判断文件名是否过长需要提示
const isNameTooLong = (name: string) => {
  // 通过基本字符宽度估算，假设每个字符平均宽度为10px，计算名称真实宽度是否超过显示区域
  // 这里假设最大显示宽度为240px，根据实际情况可调整
  const estimatedWidth = name.length * 10;
  return estimatedWidth > 240;
};
</script>

<style lang="scss" scoped>
// 定义变量
$primary-bg: #fff;
$border-radius: 8px;
$box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
$mobile-breakpoint: 768px;
$small-mobile-breakpoint: 576px;
$section-margin: 15px;
$section-padding: 15px;

.r2-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  
  @media (max-width: $mobile-breakpoint) {
    padding: 15px 10px;
  }
  
  // 减小分区之间的间距
  & > * + * {
    margin-top: $section-margin;
  }
}

h1 {
  text-align: center;
  margin-bottom: 20px; /* 减小标题下方间距 */
  
  @media (max-width: $mobile-breakpoint) {
    font-size: 24px;
    margin-bottom: 15px;
  }
}

h2 {
  margin: 15px 0; /* 减小标题的上下间距 */
  
  @media (max-width: $mobile-breakpoint) {
    font-size: 20px;
    margin: 10px 0;
  }
}

// 通用区块样式
%section-style {
  background-color: $primary-bg;
  border-radius: $border-radius;
  padding: $section-padding;
  margin-bottom: $section-margin;
  box-shadow: $box-shadow;
  
  @media (max-width: $mobile-breakpoint) {
    padding: 12px;
    margin-bottom: $section-margin;
  }
}

.config-section,
.upload-section,
.files-section {
  @extend %section-style;
}

.files-section {
  margin-bottom: 30px; /* 减小底部空间 */
}

.connection-status {
  margin-top: 10px; /* 减小状态区域的上边距 */
}

.upload-progress {
  margin-top: 15px;
}

.file-name {
  cursor: default;
  word-break: break-all;
  display: inline-block;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  &.folder-name {
    cursor: pointer;
    color: #409eff;
    font-weight: bold;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  @media (max-width: $mobile-breakpoint) {
    max-width: 120px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  
  @media (max-width: $mobile-breakpoint) {
    flex-direction: column;
  }
}

.config-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.config-info {
  margin-bottom: 10px;
}

.troubleshooting-tips {
  margin-top: 10px; /* 减小排查建议的上边距 */
  
  .tips-content {
    padding: 8px;
    
    h4 {
      margin-bottom: 8px;
    }
    
    ol {
      padding-left: 20px;
    }
  }
}

.file-table {
  width: 100%;
  
  @media (max-width: $mobile-breakpoint) {
    font-size: 14px;
  }
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  
  @media (max-width: $small-mobile-breakpoint) {
    flex-direction: column;
    
    .el-button {
      margin-left: 0 !important;
    }
  }
}

.upload-status {
  margin-top: 5px;
  font-size: 14px;
  text-align: center;
}

/* 针对移动设备的优化 */
@media (max-width: $small-mobile-breakpoint) {
  .el-dialog {
    width: 95% !important;
  }
  
  .el-form-item__label {
    padding-bottom: 5px;
  }
  
  .el-upload {
    width: 100%;
  }
  
  .el-upload-dragger {
    width: 100% !important;
  }
  
  .el-button {
    padding: 8px 15px;
    
    & + .el-button {
      margin-left: 0;
    }
  }
  
  .config-actions {
    justify-content: center;
  }
}

.files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px; /* 减小文件列表头部的下边距 */
  
  @media (max-width: $mobile-breakpoint) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

.file-actions-main {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  
  @media (max-width: $mobile-breakpoint) {
    flex-direction: column;
    align-items: stretch;
    margin-top: 10px;
  }
}

.mobile-file-info {
  margin-top: 15px;
  border-top: 1px solid #eee;
  padding-top: 15px;
  
  .mobile-file-details {
    padding: 5px;
    
    p {
      margin: 5px 0;
    }
    
    .mobile-actions {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
  }
}

.pagination-container {
  margin-top: 15px; /* 减小分页控件的上边距 */
  display: flex;
  justify-content: center;
  padding-bottom: 20px; /* 减小底部内边距 */
}

:deep(.el-pagination) {
  justify-content: center;
  white-space: normal;
  flex-wrap: wrap;
  margin-bottom: 15px; /* 减小分页的底部边距 */
  
  @media (max-width: $small-mobile-breakpoint) {
    .el-pagination__sizes {
      display: none !important;
    }
  }
}

/* 修复移动端滚动问题 */
:deep(.el-table__body-wrapper) {
  overflow-y: visible;
  overflow-x: auto;
}

/* 确保整个页面可滚动并减小间距 */
:deep(html), :deep(body) {
  height: auto !important;
  min-height: 100%;
  margin: 0;
  padding: 0;
  overflow-y: auto !important;
  overflow-x: hidden;
  line-height: 1.4; /* 减小默认行高 */
}

// 深度选择器优化 - 使用正确的语法
:deep(.el-main) {
  padding: 10px; /* 减小主内容区域的内边距 */
}

:deep(.el-card) {
  margin-bottom: 15px;
}

:deep(.el-card__body) {
  padding: 10px; /* 减小卡片内边距 */
}

:deep(.el-form-item) {
  margin-bottom: 15px; /* 减小表单项间距 */
}

:deep(.el-table) {
  font-size: 13px; /* 稍微减小表格字体大小 */
  overflow-y: visible;
}

:deep(.el-table .cell) {
  word-break: break-all;
}
  
@media (max-width: $small-mobile-breakpoint) {
  :deep(.el-table) {
    font-size: 12px;
  }
}

:deep(.el-upload-dragger) {
  padding: 15px;
}

:deep(p), :deep(h3), :deep(h4) {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.path-navigation {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
  
  h2 {
    margin-bottom: 0;
  }
  
  .file-actions-main {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 10px 0;
    
    @media (max-width: $mobile-breakpoint) {
      flex-direction: row;
      justify-content: flex-start;
    }
  }
  
  .breadcrumb {
    display: flex;
    align-items: center;
    font-size: 14px;
    padding: 8px 12px;
    background-color: #f8f9fa;
    border-radius: 4px;
    
    @media (max-width: $mobile-breakpoint) {
      font-size: 12px;
      flex-wrap: wrap;
    }
  }
}

:deep(.el-breadcrumb__item) {
  cursor: pointer;
  
  &:hover {
    color: #409eff;
  }
}

/* 图片预览对话框样式 */
.image-preview-dialog {
  :deep(.el-dialog) {
    max-width: 900px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    margin: 5vh auto !important;
    
    @media (max-width: $mobile-breakpoint) {
      width: 95% !important;
      max-width: 95%;
      margin: 2vh auto !important;
    }
  }
  
  :deep(.el-dialog__header) {
    padding: 15px 20px;
    border-bottom: 1px solid #eaeaea;
    position: relative;
    z-index: 30;
  }
  
  :deep(.el-dialog__headerbtn) {
    position: absolute;
    top: 15px;
    right: 20px;
    width: 24px;
    height: 24px;
    z-index: 30;
  }
  
  :deep(.el-dialog__close) {
    font-size: 20px;
    color: #606266;
  }
  
  :deep(.el-dialog__body) {
    padding: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  
  .preview-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 500px;
    min-height: 200px;
    max-height: 60vh;
    background-color: #f5f5f5;
    border-radius: 4px;
    position: relative;
    padding: 10px 0;
    overflow: auto;
    
    @media (max-width: $mobile-breakpoint) {
      min-height: 150px;
      max-height: 50vh;
      padding: 10px 0;
    }
  }

  .image-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    transition: transform 0.3s ease;
    overflow: visible;
    transform-origin: center center;
  }

  .preview-image {
    max-width: 100%;
    max-height: 55vh;
    object-fit: contain;
    object-position: center;
    margin: 0 auto;
    display: block;
  }
  
  :deep(.el-image) {
    width: 100%;
    height: 55vh;
    display: flex;
    justify-content: center;
    align-items: center;
    
    img {
      max-height: 100%;
      height: auto;
      width: auto;
      max-width: 100%;
      object-fit: scale-down;
    }
  }

  .image-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px;
    color: #f56c6c;

    .el-icon {
      font-size: 48px;
      margin-bottom: 15px;
    }

    p {
      margin: 0;
      font-size: 16px;
    }
  }

  .zoom-controls {
    display: flex;
    gap: 10px;
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 20px;
    padding: 5px 10px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .navigation-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 15px;
    gap: 15px;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 20px;
    padding: 5px 15px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .preview-actions {
    display: flex;
    justify-content: center;
    padding: 15px 0;
    background-color: #fff;
    border-top: 1px solid #eaeaea;
  }

  .image-counter {
    font-size: 14px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 3px 8px;
    border-radius: 12px;
  }
}

.no-config-tip {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  
  :deep(.el-alert) {
    max-width: 450px;
    width: 100%;
  }
}

.upload-section {
  @extend %section-style;
  
  .upload-actions {
    margin-bottom: 12px;
    
    .create-folder-input {
      max-width: 100%;
      
      @media (min-width: $mobile-breakpoint) {
        max-width: 400px;
      }
    }
  }
}

/* 批量操作区域 */
.batch-actions {
  margin-top: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* 文件操作按钮组样式 */
.files-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  
  @media (max-width: $mobile-breakpoint) {
    flex-direction: column;
    align-items: stretch;
    margin-top: 10px;
  }
}

/* 上传对话框样式 */
.upload-container {
  display: flex;
  flex-direction: column;
  
  .upload {
    width: 100%;
    
    :deep(.el-upload-dragger) {
      width: auto;
      height: 180px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      
      @media (max-width: $mobile-breakpoint) {
        height: 150px;
      }
    }
  }
  
  .upload-progress {
    margin-top: 15px;
    padding: 10px;
    background-color: #f9f9f9;
    border-radius: 4px;
    
    .upload-status {
      margin-top: 8px;
      text-align: center;
      color: #606266;
      font-size: 14px;
    }
  }
}

/* 文件夹位置提示 */
.folder-location-tip {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
  border-left: 3px solid #409eff;
  color: #606266;
}

/* 对话框底部按钮 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  
  @media (max-width: $small-mobile-breakpoint) {
    flex-direction: column;
  }
}
</style> 
