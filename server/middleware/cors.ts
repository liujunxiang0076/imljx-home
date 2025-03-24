import { defineEventHandler, setHeaders } from 'h3'

export default defineEventHandler((event) => {
  // 允许所有跨域请求
  setHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
  })

  // 处理预检请求
  if (event.method === 'OPTIONS') {
    setHeaders(event, {
      'Content-Length': '0',
      'Content-Type': 'text/plain'
    })
    event.respondWith(new Response(null, { status: 204 }))
  }
}) 
