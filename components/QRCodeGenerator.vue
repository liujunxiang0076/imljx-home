<template>
  <div class="qr-generator-container">
    <div class="qr-generator">
      <div class="fixed-section">
        <el-card class="input-card">
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
        </el-card>
      </div>
      
      <div class="scrollable-section" v-if="qrCodes.length">
        <el-card class="qr-card">
          <div class="list-header">
            <h2 class="subtitle">生成的二维码</h2>
            <el-button type="primary" @click="downloadAll" :disabled="!qrCodes.length">
              <el-icon><Download /></el-icon>
              下载全部
            </el-button>
          </div>
          <div class="qr-grid">
            <div v-for="(code, index) in qrCodes" :key="index" class="qr-item">
              <el-button
                class="delete-btn"
                type="danger"
                circle
                size="small"
                @click="deleteQR(index)"
              >
                <el-icon><Close /></el-icon>
              </el-button>
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
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import QRCode from 'qrcode'
import { Download, InfoFilled, Close } from '@element-plus/icons-vue'
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

// 监听文本变化
watch(text, () => {
  generateQRs()
})

// 组件挂载时生成二维码
onMounted(() => {
  if (text.value) {
    generateQRs()
  }
})

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

const deleteQR = (index: number) => {
  // 从文本中删除对应的行
  const lines = text.value.split('\n')
  lines.splice(index, 1)
  text.value = lines.join('\n')
  
  // 从二维码列表中删除
  qrCodes.value.splice(index, 1)
  
  ElMessage.success('二维码已删除')
}
</script>

<style scoped>
.qr-generator-container {
  width: 100%;
  min-height: 100vh;
  background: #f0f2f5;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.qr-generator {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fixed-section {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #f0f2f5;
  padding-bottom: 16px;
  width: 100%;
}

.input-card,
.qr-card {
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  background: white;
  transition: all 0.3s ease;
}

.input-card:hover,
.qr-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

.header {
  text-align: center;
  margin-bottom: 32px;
  padding: 0 20px;
}

.title {
  font-size: 32px;
  color: #2c3e50;
  margin-bottom: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.description {
  color: #5c6b7f;
  line-height: 1.8;
  font-size: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.input-section {
  margin: 0 20px 24px;
}

.tips {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8492a6;
  font-size: 14px;
  margin-top: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 24px;
}

.subtitle {
  font-size: 22px;
  color: #2c3e50;
  margin: 0;
  font-weight: 500;
}

.qr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
  padding: 24px;
  width: 100%;
}

.qr-item {
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s ease;
  position: relative;
  height: fit-content;
  border: 1px solid #edf2f7;
}

.qr-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #e2e8f0;
}

.qr-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.qr-item img {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  background: white;
  padding: 12px;
  object-fit: contain;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.qr-text {
  margin: 0;
  text-align: center;
  word-break: break-all;
  color: #4a5568;
  font-size: 14px;
  line-height: 1.6;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409eff inset;
}

:deep(.el-button) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.delete-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  opacity: 1;
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .qr-generator {
    padding: 16px;
    gap: 12px;
  }
  
  .input-card,
  .qr-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  .header {
    margin-bottom: 24px;
  }
  
  .title {
    font-size: 28px;
  }
  
  .qr-grid {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 20px;
  }
  
  .list-header {
    padding: 0 16px;
  }
  
  .qr-item {
    padding: 20px;
  }
  
  .fixed-section {
    padding-bottom: 12px;
  }
}
</style> 
