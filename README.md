# imljx-home

个人主页项目，基于Nuxt 3构建。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2Fimljx-home)

## 技术栈

- **框架**: [Nuxt 3](https://nuxt.com/) (v3.16.0)
- **UI**: Vue 3 (v3.5.13)
- **路由**: Vue Router (v4.5.0)
- **包管理**: pnpm (v10.6.2)
- **HTTP**: h3 (v1.15.1)

## 功能特点

- 响应式设计
- SEO优化
- 快速加载
- 多搜索引擎支持（Google、Bing、百度）
- 必应每日壁纸集成
- 优雅的动画效果

## 开发环境

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

## API

### 必应每日壁纸

```typescript
GET /api/bing-image
```

返回必应每日壁纸信息，包含：
- 图片URL
- 版权信息
- 标题

## 许可证

[MIT](LICENSE) 
