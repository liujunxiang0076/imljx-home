import { defineEventHandler, getRequestURL, H3Event } from 'h3'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  
  // 只处理预览请求 - 检查路径是否包含图片后缀
  const isImageRequest = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url.pathname)
  const isPreviewRequest = url.pathname.startsWith('/r2-proxy/') && isImageRequest
  
  if (isPreviewRequest) {
    console.log('拦截到图片预览请求:', url.pathname)
    
    // 提取R2路径（删除/r2-proxy前缀）
    const r2Path = url.pathname.replace(/^\/r2-proxy/, '')
    
    // 构建R2完整URL
    const r2Endpoint = process.env.CLOUDFLARE_R2_ENDPOINT?.replace(/\/+$/, '') || 
                       'https://55c5839cf9e673e89e50b4b980152fc9.r2.cloudflarestorage.com'
    const targetUrl = `${r2Endpoint}${r2Path}${url.search || ''}`
    
    console.log('代理图片预览请求到:', targetUrl)
    
    try {
      // 专门处理图片请求 - 保持响应类型，不转换为文本
      const response = await fetch(targetUrl, {
        method: 'GET',  // 图片预览只使用GET
        headers: {
          'Accept': 'image/*',
          // 移除可能导致问题的头部
          'Host': new URL(targetUrl).host,
          // 添加所有查询参数作为头部
          ...(url.search ? Object.fromEntries(new URLSearchParams(url.search).entries()) : {})
        }
      })
      
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status} ${response.statusText}`)
      }
      
      // 检测内容类型
      const contentType = response.headers.get('content-type') || 'application/octet-stream'
      if (!contentType.startsWith('image/')) {
        console.warn('警告: 请求的资源不是图片:', contentType)
      }
      
      // 获取原始二进制数据
      const buffer = await response.arrayBuffer()
      
      // 构建响应头
      const headers = new Headers()
      headers.set('Content-Type', contentType)
      headers.set('Content-Length', buffer.byteLength.toString())
      headers.set('Cache-Control', 'public, max-age=31536000')  // 长期缓存
      headers.set('Content-Disposition', 'inline')  // 强制内联显示
      
      // 添加CORS头
      headers.set('Access-Control-Allow-Origin', '*')
      headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
      headers.set('Access-Control-Allow-Headers', '*') 
      headers.set('Access-Control-Expose-Headers', '*')
      
      // 复制原始响应中的其他重要头
      const headersToCopy = ['ETag', 'Last-Modified', 'x-amz-meta-*']
      for (const [key, value] of response.headers.entries()) {
        // 复制所有Amazon元数据头
        if (key.toLowerCase().startsWith('x-amz-') || headersToCopy.includes(key)) {
          headers.set(key, value)
        }
      }
      
      // 返回图片数据
      event.respondWith(
        new Response(buffer, {
          status: 200,
          headers
        })
      )
      
      return // 终止中间件链
    } catch (error) {
      console.error('图片预览代理错误:', error)
      
      // 返回错误响应
      event.respondWith(
        new Response(
          JSON.stringify({
            error: '图片预览失败',
            message: error instanceof Error ? error.message : String(error),
            url: targetUrl
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      )
      
      return // 终止中间件链
    }
  }
})
