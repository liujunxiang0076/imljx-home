import { defineConfig } from 'windicss/helpers'

export default defineConfig({
  extract: {
    include: [
      'components/**/*.{vue,js,ts}',
      'layouts/**/*.vue',
      'pages/**/*.vue',
      'app.vue'
    ]
  },
  theme: {
    extend: {
      // 自定义主题配置
    }
  },
  plugins: [
    // 添加插件
  ]
}) 
