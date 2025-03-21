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
          <el-input
            v-model="form.text"
            placeholder="请输入文本内容"
            @input="generateQRCode"
          ></el-input>
        </el-form-item>
      </div>

      <!-- 网址 -->
      <div v-if="form.contentType === 'url'">
        <el-form-item label="网址">
          <el-input
            v-model="form.url"
            placeholder="请输入网址"
            @input="generateQRCode"
          ></el-input>
        </el-form-item>
      </div>

      <!-- 邮箱 -->
      <div v-if="form.contentType === 'email'">
        <el-form-item label="邮箱地址">
          <el-input
            v-model="form.email.address"
            placeholder="请输入邮箱地址"
            @input="generateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="主题">
          <el-input
            v-model="form.email.subject"
            placeholder="请输入邮件主题"
            @input="generateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="form.email.body"
            type="textarea"
            placeholder="请输入邮件内容"
            @input="generateQRCode"
          ></el-input>
        </el-form-item>
      </div>

      <!-- 电话 -->
      <div v-if="form.contentType === 'phone'">
        <el-form-item label="电话号码">
          <el-input
            v-model="form.phone"
            placeholder="请输入电话号码"
            @input="generateQRCode"
          ></el-input>
        </el-form-item>
      </div>

      <!-- 短信 -->
      <div v-if="form.contentType === 'sms'">
        <el-form-item label="手机号码">
          <el-input
            v-model="form.sms.number"
            placeholder="请输入手机号码"
            @input="generateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="短信内容">
          <el-input
            v-model="form.sms.message"
            type="textarea"
            placeholder="请输入短信内容"
            @input="generateQRCode"
          ></el-input>
        </el-form-item>
      </div>

      <!-- WiFi -->
      <div v-if="form.contentType === 'wifi'">
        <el-form-item label="网络名称 (SSID)">
          <el-input
            v-model="form.wifi.ssid"
            placeholder="请输入WiFi名称"
            @input="generateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="加密类型">
          <el-select
            v-model="form.wifi.encryption"
            placeholder="请选择加密类型"
            @change="generateQRCode"
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
            @input="generateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="隐藏网络">
          <el-switch
            v-model="form.wifi.hidden"
            @change="generateQRCode"
          ></el-switch>
        </el-form-item>
      </div>

      <!-- 名片 -->
      <div v-if="form.contentType === 'vcard'">
        <el-form-item label="姓名">
          <el-input
            v-model="form.vcard.name"
            placeholder="请输入姓名"
            @input="generateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="电话">
          <el-input
            v-model="form.vcard.phone"
            placeholder="请输入电话"
            @input="generateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input
            v-model="form.vcard.email"
            placeholder="请输入邮箱"
            @input="generateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="公司">
          <el-input
            v-model="form.vcard.company"
            placeholder="请输入公司"
            @input="generateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="职位">
          <el-input
            v-model="form.vcard.title"
            placeholder="请输入职位"
            @input="generateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="网址">
          <el-input
            v-model="form.vcard.url"
            placeholder="请输入网址"
            @input="generateQRCode"
          ></el-input>
        </el-form-item>
        <el-form-item label="地址">
          <el-input
            v-model="form.vcard.address"
            placeholder="请输入地址"
            @input="generateQRCode"
          ></el-input>
        </el-form-item>
      </div>

      <el-form-item label="二维码颜色">
        <el-color-picker
          v-model="form.foreground"
          @change="generateQRCode"
        ></el-color-picker>
      </el-form-item>

      <el-form-item label="背景颜色">
        <el-color-picker
          v-model="form.background"
          @change="generateQRCode"
        ></el-color-picker>
      </el-form-item>

      <el-form-item label="误差校正级别">
        <el-select
          v-model="form.errorCorrectionLevel"
          placeholder="请选择误差校正级别"
          @change="generateQRCode"
        >
          <el-option label="低 (L)" value="L"></el-option>
          <el-option label="中 (M)" value="M"></el-option>
          <el-option label="高 (Q)" value="Q"></el-option>
          <el-option label="最高 (H)" value="H"></el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <div class="qrcode-container">
      <div ref="qrcodeRef" class="qrcode"></div>
      <div class="qrcode-actions" v-if="isContentValid">
        <el-button @click="downloadQRCode('png')" type="primary">
          下载 PNG
        </el-button>
        <el-button @click="downloadQRCode('svg')" type="success">
          下载 SVG
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue'
import QRCode from 'qrcode'
import { saveAs } from 'file-saver'

const qrcodeRef = ref(null)
const canvas = ref(null)
const isContentValid = ref(false)

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
  errorCorrectionLevel: 'M'
})

const generateContent = () => {
  switch (form.contentType) {
    case 'text':
      return form.text
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

const validateContent = () => {
  const content = generateContent()
  isContentValid.value = content.length > 0
  return content
}

const generateQRCode = () => {
  const content = validateContent()
  if (!content) return

  const options = {
    errorCorrectionLevel: form.errorCorrectionLevel,
    margin: 1,
    color: {
      dark: form.foreground,
      light: form.background
    }
  }

  if (qrcodeRef.value) {
    // 清空容器
    qrcodeRef.value.innerHTML = ''
    
    // 创建Canvas元素
    canvas.value = document.createElement('canvas')
    qrcodeRef.value.appendChild(canvas.value)
    
    // 生成QR码
    QRCode.toCanvas(canvas.value, content, options, (error) => {
      if (error) console.error(error)
    })
  }
}

const downloadQRCode = async (format) => {
  const content = validateContent()
  if (!content) return

  const options = {
    errorCorrectionLevel: form.errorCorrectionLevel,
    margin: 1,
    color: {
      dark: form.foreground,
      light: form.background
    }
  }

  try {
    if (format === 'png') {
      const dataUrl = await QRCode.toDataURL(content, options)
      saveAs(dataUrl, 'qrcode.png')
    } else if (format === 'svg') {
      const svgString = await QRCode.toString(content, {
        ...options,
        type: 'svg'
      })
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      saveAs(blob, 'qrcode.svg')
    }
  } catch (error) {
    console.error('下载QR码时出错：', error)
  }
}

watch(() => form.contentType, generateQRCode)

onMounted(() => {
  generateQRCode()
})
</script>

<style lang="scss" scoped>
.qrcode-generator {
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem;
  
  h1 {
    text-align: center;
    margin-bottom: 1.5rem;
  }
}

.qrcode-container {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .qrcode {
    background-color: #ffffff;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
  
  .qrcode-actions {
    margin-top: 1rem;
    display: flex;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .qrcode-generator {
    padding: 1rem;
  }
}
</style> 
