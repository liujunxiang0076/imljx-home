# imljx-home

个人主页项目，基于Nuxt 3构建。集成二维码生成、云存储管理等核心功能。

## 项目概述
提供以下核心功能：
- 🖼️ 必应每日壁纸展示
- 🔍 多搜索引擎快捷入口
- 🎨 可视化二维码生成器（支持7种内容格式）
- ☁️ Cloudflare R2云存储管理
- ⚡ Nuxt 3服务端API集成
- 📱 响应式移动端适配

![功能截图](/docs/screenshot.png)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2Fimljx-home)

## 架构设计
![架构图](/docs/architecture.png)

核心模块：
- 前端应用层：Nuxt3 + Vue3
- API服务层：Nitro Server
- 存储层：Cloudflare R2
- 工具层：QR生成/压缩工具

## 技术栈

- **框架**: [Nuxt 3](https://nuxt.com/) (v3.16.0)
- **UI**: Vue 3 (v3.5.13) + Element Plus (v2.9.6)
- **路由**: Vue Router (v4.5.0)
- **包管理**: pnpm (v10.6.2)
- **HTTP**: h3 (v1.15.1)
- **二维码**: qrcode (v1.5.4)
- **文件处理**: file-saver (v2.0.5), jszip (v3.10.1)
- **云存储**: @aws-sdk/client-s3, @aws-sdk/s3-request-presigner

## 部署指南

### 本地开发
```bash
pnpm dev
```

### 生产构建
```bash
pnpm build
```

### Vercel部署
1. 关联Git仓库
2. 设置环境变量
3. 开启自动部署

## 功能特点

- 响应式设计，支持移动端和桌面端
- SEO优化
- 快速加载
- 多搜索引擎支持（Google、Bing、百度）
- 必应每日壁纸集成
- 优雅的动画效果
- 二维码生成器
  - 支持文本、URL、电子邮件、电话、短信、WiFi和vCard格式
  - 自定义颜色和误差校正级别
  - 批量生成和下载
  - 支持PNG和SVG格式
  - 自动根据内容命名下载文件
  - 文本过长时提供悬停提示显示完整内容
  - 批量下载时自动压缩为ZIP文件
- Cloudflare R2云存储
  - 文件上传与下载
  - 文件预览与管理
  - 上传进度显示
  - 预签名URL支持
  - 文件批量管理

## API文档
[查看API接口文档](/server/api/README.md)

包含接口：
- GET /api/bing-image
- POST /api/r2/upload
- GET /api/search-suggestions

## 开发环境

### 环境变量配置
复制.env.example文件为.env并配置：
```env
# Bing壁纸API
BING_API_KEY=your_key

# R2存储配置
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket

# 前端配置
BASE_URL=https://your-domain.com
```

### 前提条件

- Node.js (推荐v18+)
- pnpm (v10.6.2+)

### 安装依赖

```bash
pnpm install
```

### 开发服务器

```bash
pnpm dev
```

应用将在 [http://localhost:3000](http://localhost:3000) 运行。

### 构建生产版本

```bash
pnpm build
```

## 部署

### Vercel部署

项目已配置好Vercel部署文件，可以通过以下方式部署：

1. 点击上方的"Deploy with Vercel"按钮
2. 或者将代码推送到GitHub，然后在Vercel导入

### 手动部署

```bash
pnpm build
```

生成的文件位于`.output/public`目录中。

## 配置

主要配置文件：

- `nuxt.config.ts` - Nuxt配置
- `app.vue` - 应用入口
- `vercel.json` - Vercel部署配置
- `server/api/bing-image.ts` - 必应壁纸API配置
- `.env` - 环境变量配置（可选，也可以使用Web界面配置）

## 组件

### 二维码生成器

`components/widgets/QRCodeGenerator.vue` 提供完整的二维码生成功能：

- 多种内容类型支持
  - 文本：支持多行内容，可选择性生成
  - URL：支持各种网址格式
  - 电子邮件：支持地址、主题和正文
  - 电话：生成可点击拨号的二维码
  - 短信：包含号码和预设消息
  - WiFi：自动生成连接配置（SSID、密码、加密类型）
  - vCard：生成包含完整联系人信息的名片

- 样式自定义
  - 自定义前景色和背景色
  - 可调节二维码尺寸
  - 多级误差校正选项

- 导出选项
  - PNG和SVG格式导出
  - 批量生成和下载（自动打包为ZIP）
  - 智能文件命名：根据内容自动生成文件名

### Cloudflare R2存储

`pages/r2-storage.vue` 提供与Cloudflare R2对象存储的集成：

- 文件管理
  - 拖拽上传文件
  - 实时进度条显示
  - 文件列表展示（名称、大小、修改时间）
  - 文件删除功能

- 安全特性
  - 使用预签名URL进行上传和下载
  - 自动过期的临时访问链接
  - 服务端API安全控制

- 配置界面
  - 可视化配置R2连接信息
  - 本地存储配置（无需修改环境变量）
  - 配置测试功能
  - 安全密码输入框

- 使用方法
  - 访问`/r2-storage`页面
  - 点击"设置配置"按钮
  - 输入R2凭证信息
  - 测试连接成功后开始使用

## API

### 必应每日壁纸

```typescript
GET /api/bing-image
```

返回必应每日壁纸信息，包含：
- 图片URL
- 版权信息
- 标题

### Cloudflare R2 API

```typescript
GET /api/r2?action=list
```
列出R2存储桶中的所有对象

```typescript
POST /api/r2?action=getUploadUrl
// body: { fileName: string, contentType: string }
```
获取文件上传预签名URL

```typescript
POST /api/r2?action=getDownloadUrl
// body: { fileName: string }
```
获取文件下载预签名URL

```typescript
POST /api/r2?action=delete
// body: { fileName: string }
```
删除指定的文件

## 许可证

[MIT](LICENSE)
