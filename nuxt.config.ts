import { defineNuxtConfig } from 'nuxt/config'
import { createRequire } from 'module'
// Nuxt配置文档链接
// https://nuxt.com/docs/api/configuration/nuxt-config

// 创建require函数以兼容CommonJS模块
const require = createRequire(import.meta.url)
const elementPlusVersion = require('element-plus/package.json').version

export default defineNuxtConfig({
  // 兼容性日期：指定Nuxt使用的特性集版本，有助于在升级时保持向后兼容性
  compatibilityDate: '2024-11-01',
  
  // 开发工具：启用Nuxt开发工具，提供调试和性能分析功能
  devtools: { enabled: true },
  
  // 添加模块
  modules: [
    '@element-plus/nuxt',
    'nuxt-windicss'
  ],
  
  // 修改构建策略，使用CSR模式
  ssr: false,
  
  // 解决element-plus构建错误
  build: {
    transpile: ['element-plus'],
  },
  
  // 运行时配置
  runtimeConfig: {
    public: {
      elementPlus: {
        importStyle: 'scss',
        themes: ['dark']
      }
    }
  },

  // 构建优化
  experimental: {
    payloadExtraction: false
  },

  // 自动导入配置
  imports: {
    autoImport: true
  },

  // Nitro 配置
  nitro: {
    externals: {
      inline: ['element-plus']
    },
    // 提高代理请求的超时时间
    timing: true
  },

  components: {
    dirs: [
      {
        path: '~/components/common',
        global: true
      },
      {
        path: '~/components/search',
        global: true
      },
      {
        path: '~/components/shortcut',
        global: true
      },
      {
        path: '~/components/time',
        global: true
      },
      {
        path: '~/components/widgets',
        global: true
      },
      '~/components'
    ]
  },

  // 修改构建策略，使用CSR模式
  vite: {
    define: {
      'process.env.ELEMENT_PLUS_VERSION': JSON.stringify(elementPlusVersion),
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            // 搜索栏变量
            $search-bar-height: 3rem;
            $search-bar-radius: 2rem;
            $search-bar-width: 350px;
            $search-bar-expanded-width: 750px;
            $search-bar-collapsed-width: 300px;
            $search-bar-transition: all 0.3s ease;
            $transition-timing: cubic-bezier(0.4, 0, 0.2, 1);
            
            // Toast变量
            $toast-bg-color: #ffffff;
            $toast-text-color: #000000;
            $toast-border-radius: 999px;
            $toast-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            $toast-animation-duration: 0.4s;

            // 动画变量
            $animation-duration: 0.3s;
            $animation-timing: ease-in-out;
          `
        }
      }
    }
  },
})
