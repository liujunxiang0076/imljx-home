<template>
  <div class="qr-generator">
    <el-card class="box-card">
      <div class="header">
        <h1 class="title">二维码生成器</h1>
        <p class="description">
          输入要生成二维码的内容，每行一个，系统会自动为每行内容生成独立的二维码。
          支持文本、URL、联系方式等多种格式。
        </p>
      </div>
      
      <div class="input-section">
        <el-input
          v-model="text"
          placeholder="请输入要生成二维码的内容，每行一个"
          :rows="5"
          type="textarea"
          @input="generateQRs"
          resize="none"
        />
        <div class="tips">
          <el-icon><InfoFilled /></el-icon>
          <span>提示：每行输入一个内容，系统会自动生成对应的二维码</span>
        </div>
      </div>
      
      <div class="qr-list" v-if="qrCodes.length">
        <div class="list-header">
          <h2 class="subtitle">生成的二维码</h2>
          <el-button type="primary" @click="downloadAll" :disabled="!qrCodes.length">
            <el-icon><Download /></el-icon>
            下载全部
          </el-button>
        </div>
        <div class="qr-grid">
          <div v-for="(code, index) in qrCodes" :key="index" class="qr-item">
            <div class="qr-content">
              <img :src="code.dataUrl" :alt="code.text" />
              <p class="qr-text">{{ code.text }}</p>
            </div>
            <el-button type="primary" size="small" @click="downloadQR(code, index)">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import QRCode from 'qrcode'
import { Download, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface QRCodeItem {
  text: string
  dataUrl: string
}

const text = ref('')
const qrCodes = ref<QRCodeItem[]>([])

const generateQRs = async () => {
  if (!text.value) {
    qrCodes.value = []
    return
  }
  
  const lines = text.value.split('\n').filter(line => line.trim())
  
  try {
    const codes = await Promise.all(
      lines.map(async (line): Promise<QRCodeItem> => ({
        text: line,
        dataUrl: await QRCode.toDataURL(line, {
          width: 200,
          margin: 2,
        })
      }))
    )
    qrCodes.value = codes
  } catch (err) {
    ElMessage.error('生成二维码失败')
    console.error(err)
  }
}

const downloadQR = (code: QRCodeItem, index: number) => {
  const link = document.createElement('a')
  link.download = `qrcode-${index + 1}.png`
  link.href = code.dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('二维码已下载')
}

const downloadAll = () => {
  qrCodes.value.forEach((code, index) => {
    const link = document.createElement('a')
    link.download = `qrcode-${index + 1}.png`
    link.href = code.dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  })
  ElMessage.success('所有二维码已下载')
}
</script>

<style scoped>
.qr-generator {
  max-width: 1000px;
  margin: 40px auto;
  padding: 0 20px;
}

.box-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.title {
  font-size: 28px;
  color: #303133;
  margin-bottom: 16px;
  font-weight: 600;
}

.description {
  color: #606266;
  line-height: 1.6;
  font-size: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.input-section {
  margin-bottom: 40px;
}

.tips {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 14px;
  margin-top: 12px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.subtitle {
  font-size: 20px;
  color: #303133;
  margin: 0;
  font-weight: 500;
}

.qr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
}

.qr-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s ease;
}

.qr-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.qr-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.qr-item img {
  width: 200px;
  height: 200px;
  border-radius: 4px;
  background: white;
  padding: 8px;
}

.qr-text {
  margin: 0;
  text-align: center;
  word-break: break-all;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409eff inset;
}

:deep(.el-button) {
  border-radius: 4px;
}

@media (max-width: 768px) {
  .qr-generator {
    margin: 20px auto;
  }
  
  .title {
    font-size: 24px;
  }
  
  .qr-grid {
    grid-template-columns: 1fr;
  }
}
</style> 
