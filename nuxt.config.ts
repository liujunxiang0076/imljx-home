import { defineNuxtConfig } from 'nuxt/config'
// Nuxt配置文档链接
// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  // 兼容性日期：指定Nuxt使用的特性集版本，有助于在升级时保持向后兼容性
  compatibilityDate: '2024-11-01',
  
  // 开发工具：启用Nuxt开发工具，提供调试和性能分析功能
  devtools: { enabled: true },
  
  // 添加 Element Plus 配置
  modules: [
    '@element-plus/nuxt'
  ],
  
  // 构建配置
  build: {
    transpile: ['element-plus/es']
  },
  
  // 运行时配置
  runtimeConfig: {
    public: {
      elementPlus: {
        importStyle: 'scss'
      }
    }
  }
})
