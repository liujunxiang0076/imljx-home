<template>
  <div class="r2-container">
    <h1>Cloudflare R2 对象存储测试</h1>
    
    <!-- 配置表单 -->
    <div class="config-section">
      <h2>R2 配置</h2>
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
        title="Cloudflare R2 配置"
        width="90%"
        :max-width="500"
        top="5vh"
        :fullscreen="screenWidth < 600"
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
            <el-input v-model="config.endpoint" :placeholder="r2Endpoint || 'https://<账户ID>.r2.cloudflarestorage.com'" />
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
          :title="connectionSuccess ? 'R2连接成功' : 'R2连接失败'"
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
                <li>检查终端节点URL格式是否正确，应为 <code>https://&lt;账户ID&gt;.r2.cloudflarestorage.com</code>，不要添加存储桶名称或其他路径</li>
                <li>确认您的网络环境允许HTTPS连接到Cloudflare服务器，无代理或防火墙限制</li>
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
    
    <!-- 上传文件表单 -->
    <div class="upload-section">
      <h2>上传文件</h2>
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
          <div class="el-upload__tip">支持任意类型文件上传</div>
        </template>
      </el-upload>
      <div v-if="uploading" class="upload-progress">
        <el-progress :percentage="uploadProgress" />
        <p class="upload-status">{{ uploadStatusText }}</p>
      </div>
    </div>

    <!-- 文件列表 -->
    <div class="files-section">
      <div class="files-header">
        <h2>文件列表</h2>
        <el-button type="primary" @click="refreshFileList" :loading="loading">刷新</el-button>
      </div>
      
      <el-table 
        v-loading="loading" 
        :data="files" 
        style="width: 100%" 
        empty-text="没有文件"
        :default-sort="{prop: 'LastModified', order: 'descending'}"
        class="file-table"
        :span-method="screenWidth < 768 ? tableSpanMethod : undefined"
      >
        <el-table-column prop="Key" label="文件名">
          <template #default="scope">
            <el-tooltip effect="dark" :content="scope.row.Key" placement="top">
              <span class="file-name">{{ scope.row.Key }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="Size" label="大小" min-width="100" :visible="screenWidth >= 576">
          <template #default="scope">
            {{ formatFileSize(scope.row.Size) }}
          </template>
        </el-table-column>
        <el-table-column prop="LastModified" label="最后修改时间" min-width="180" sortable :visible="screenWidth >= 768">
          <template #default="scope">
            {{ formatDate(scope.row.LastModified) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="120">
          <template #default="scope">
            <div class="action-buttons">
              <el-button size="small" type="primary" @click="downloadFile(scope.row.Key)">下载</el-button>
              <el-button size="small" type="danger" @click="confirmDelete(scope.row.Key)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 移动端文件信息补充显示 -->
      <div v-if="screenWidth < 768 && files.length > 0" class="mobile-file-info">
        <el-collapse accordion>
          <el-collapse-item v-for="(file, index) in files" :key="file.Key" :title="file.Key" :name="index">
            <div class="mobile-file-details">
              <p><strong>大小:</strong> {{ formatFileSize(file.Size) }}</p>
              <p><strong>上传时间:</strong> {{ formatDate(file.LastModified) }}</p>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { UploadFilled, Setting, Refresh, InfoFilled } from '@element-plus/icons-vue';
import type { UploadRequestOptions } from 'element-plus';
import dayjs from 'dayjs';

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

// 响应式设计 - 屏幕宽度监测
const screenWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200);

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
});

onBeforeUnmount(() => {
  // 移除屏幕宽度监听
  window.removeEventListener('resize', updateScreenWidth);
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
        endpoint: r2Endpoint.value
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      files.value = data.objects || [];
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
  // 检查是否有配置
  if (!r2AccessKeyId.value || !r2SecretKey.value || !r2BucketName.value || !r2Endpoint.value) {
    ElMessage.warning('请先配置R2存储');
    return;
  }
  
  const file = options.file;
  uploading.value = true;
  uploadProgress.value = 0;
  uploadStatusText.value = '准备上传...';
  
  try {
    // 1. 获取预签名URL
    uploadStatusText.value = '获取上传链接...';
    const urlResponse = await fetch('/api/r2?action=getUploadUrl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        accessKeyId: r2AccessKeyId.value,
        secretKey: r2SecretKey.value,
        bucketName: r2BucketName.value,
        endpoint: r2Endpoint.value
      }),
    });
    
    const urlData = await urlResponse.json();
    
    if (!urlData.success) {
      throw new Error(urlData.error || '获取上传链接失败');
    }
    
    // 2. 使用预签名URL上传文件
    uploadStatusText.value = '正在上传...';
    
    // 使用XMLHttpRequest以便跟踪进度
    const xhr = new XMLHttpRequest();
    
    // 设置进度监听
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        uploadProgress.value = Math.round((event.loaded / event.total) * 100);
      }
    };
    
    // 使用Promise包装XHR请求
    await new Promise<void>((resolve, reject) => {
      xhr.open('PUT', urlData.uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`上传失败: ${xhr.status} ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('网络错误，上传失败'));
      };
      
      xhr.send(file);
    });
    
    uploadStatusText.value = '上传成功!';
    ElMessage.success('文件上传成功');
    
    // 刷新文件列表
    await refreshFileList();
  } catch (error: any) {
    ElMessage.error(error.message || '上传失败');
    uploadStatusText.value = `上传失败: ${error.message}`;
  } finally {
    setTimeout(() => {
      uploading.value = false;
    }, 2000);
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
const confirmDelete = (fileName: string) => {
  ElMessageBox.confirm(
    `确定要删除文件 "${fileName}" 吗?`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    deleteFile(fileName);
  }).catch(() => {
    // 用户取消操作
  });
};

// 删除文件
const deleteFile = async (fileName: string) => {
  try {
    const response = await fetch('/api/r2?action=delete', {
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
    
    if (data.success) {
      ElMessage.success('文件删除成功');
      await refreshFileList();
    } else {
      ElMessage.error(data.error || '删除文件失败');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '删除文件失败');
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

// 表格在移动设备上的特殊处理
const tableSpanMethod = (row: any, column: any) => {
  if (column.property === 'Key') {
    return {
      rowspan: 1,
      colspan: 1
    };
  } else if (column.property === 'Size') {
    return {
      rowspan: 1,
      colspan: 1
    };
  } else if (column.property === 'LastModified') {
    return {
      rowspan: 1,
      colspan: 1
    };
  } else if (column.property === '操作') {
    return {
      rowspan: 1,
      colspan: 1
    };
  }
  return {
    rowspan: 0,
    colspan: 0
  };
};
</script>

<style scoped>
.r2-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 15px 10px;
  }
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    font-size: 24px;
    margin-bottom: 20px;
  }
}

h2 {
  margin: 20px 0;
  
  @media (max-width: 768px) {
    font-size: 20px;
    margin: 15px 0;
  }
}

.config-section,
.upload-section, 
.files-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    padding: 15px;
    margin-bottom: 20px;
  }
}

.connection-status {
  margin-top: 15px;
}

.upload-progress {
  margin-top: 20px;
}

.file-name {
  word-break: break-all;
  display: inline-block;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  @media (max-width: 768px) {
    max-width: 120px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  
  @media (max-width: 768px) {
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
  margin-top: 15px;
}

.tips-content {
  padding: 10px;
}

.tips-content h4 {
  margin-bottom: 10px;
}

.tips-content ol {
  padding-left: 20px;
}

.file-table {
  width: 100%;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.action-buttons {
  display: flex;
  gap: 5px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.upload-status {
  margin-top: 5px;
  font-size: 14px;
  text-align: center;
}

/* 针对移动设备的优化 */
@media (max-width: 576px) {
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
  }
  
  .el-button + .el-button {
    margin-left: 0;
  }
  
  .config-actions {
    justify-content: center;
  }
}

.files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

.mobile-file-info {
  margin-top: 15px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.mobile-file-details {
  padding: 5px;
}

.mobile-file-details p {
  margin: 5px 0;
}
</style> 
