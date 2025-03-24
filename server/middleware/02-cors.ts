import { defineEventHandler, setHeaders, H3Event } from 'h3'

export default defineEventHandler((event) => {
  // 允许所有跨域请求
  setHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Range, x-amz-*',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, ETag, x-amz-*',
    'Access-Control-Max-Age': '86400'
  })

  // 处理预检请求
  if (event.method === 'OPTIONS') {
    try {
      event.respondWith(
        new Response(null, { 
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Range, x-amz-*',
            'Access-Control-Expose-Headers': 'Content-Length, Content-Range, ETag, x-amz-*',
            'Access-Control-Max-Age': '86400',
            'Content-Length': '0',
            'Content-Type': 'text/plain'
          }
        })
      )
      
      return // 终止中间件链
    } catch (error) {
      console.error('处理OPTIONS请求失败:', error)
    }
  }
})
