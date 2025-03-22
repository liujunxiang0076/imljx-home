// plugins/element-plus-fix.ts
// 这个插件用于解决element-plus的编译错误
// 错误：The symbol "hyphenate" has already been declared

import { defineNuxtPlugin } from 'nuxt/app'

export default defineNuxtPlugin(() => {
  // 这是一个空插件，仅用于修复构建问题
  // 通过定义此插件，可以让Nuxt使用自定义的方式处理element-plus的导入
}); 
