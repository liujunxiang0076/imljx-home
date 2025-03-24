import { defineEventHandler, getRequestURL, proxyRequest } from 'h3'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  
  // 只处理以/r2-proxy开头的请求
  if (url.pathname.startsWith('/r2-proxy/')) {
    console.log('拦截到R2代理请求:', url.pathname)
    
    // 提取R2路径（删除/r2-proxy前缀）
    const r2Path = url.pathname.replace(/^\/r2-proxy/, '')
    
    // 构建R2完整URL
    const r2Endpoint = process.env.CLOUDFLARE_R2_ENDPOINT?.replace(/\/+$/, '') || 
                       'https://55c5839cf9e673e89e50b4b980152fc9.r2.cloudflarestorage.com'
    const targetUrl = `${r2Endpoint}${r2Path}${url.search || ''}`
    
    console.log('代理到R2 URL:', targetUrl)
    
    // 保留所有原始头信息，但添加CORS头
    const headers = {
      ...event.headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Expose-Headers': '*',
      'Access-Control-Max-Age': '86400'
    }
    
    try {
      // 代理请求到R2
      return await proxyRequest(event, targetUrl, {
        headers,
        // 保持原始方法
        method: event.method,
        // 保持原始请求体
        fetchOptions: {
          body: event.method !== 'GET' && event.method !== 'HEAD' ? event.body : undefined
        }
      })
    } catch (error) {
      console.error('R2代理错误:', error)
      return {
        statusCode: 500,
        body: {
          error: '代理请求失败',
          message: error instanceof Error ? error.message : String(error)
        }
      }
    }
  }
}) 
