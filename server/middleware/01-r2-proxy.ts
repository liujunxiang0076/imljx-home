import { defineEventHandler, getRequestURL, H3Event } from 'h3'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  
  // 只处理以/r2-proxy开头的请求
  if (url.pathname.startsWith('/r2-proxy/')) {
    // 跳过图片预览请求，因为它们已经在00-image-preview中处理
    const isImageRequest = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url.pathname)
    if (isImageRequest) {
      // 让请求继续传递，图片预览中间件会处理它
      return
    }
    
    console.log('拦截到R2代理请求:', url.pathname)
    
    // 提取R2路径（删除/r2-proxy前缀）
    const r2Path = url.pathname.replace(/^\/r2-proxy/, '')
    
    // 构建R2完整URL
    const r2Endpoint = process.env.CLOUDFLARE_R2_ENDPOINT?.replace(/\/+$/, '') || 
                       'https://55c5839cf9e673e89e50b4b980152fc9.r2.cloudflarestorage.com'
    const targetUrl = `${r2Endpoint}${r2Path}${url.search || ''}`
    
    console.log('代理到R2 URL:', targetUrl)
    
    try {
      // 直接使用fetch而不是proxyRequest，以更好地控制请求和响应
      const response = await fetch(targetUrl, {
        method: event.method,
        headers: {
          ...Object.fromEntries(event.headers.entries()),
          // 移除可能导致问题的头部
          'host': new URL(targetUrl).host
        },
        body: event.method !== 'GET' && event.method !== 'HEAD' ? await readBody(event) : undefined
      });
      
      // 收集响应头
      const responseHeaders = new Headers();
      
      // 添加CORS头
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, HEAD, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', '*');
      responseHeaders.set('Access-Control-Expose-Headers', '*');
      responseHeaders.set('Access-Control-Max-Age', '86400');
      
      // 复制原始响应的其他头部
      for (const [key, value] of response.headers.entries()) {
        if (!key.toLowerCase().startsWith('access-control')) { // 避免CORS头冲突
          responseHeaders.set(key, value);
        }
      }
      
      // 获取响应数据
      const arrayBuffer = await response.arrayBuffer();
      
      // 返回响应
      event.respondWith(
        new Response(arrayBuffer, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        })
      );
      
      return // 终止中间件链
    } catch (error) {
      console.error('R2代理错误:', error);
      
      // 提供详细的错误信息
      event.respondWith(
        new Response(
          JSON.stringify({
            error: '代理请求失败',
            message: error instanceof Error ? error.message : String(error),
            path: r2Path,
            targetUrl: targetUrl
          }), 
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            } 
          }
        )
      );
      
      return // 终止中间件链
    }
  }
})

// 辅助函数：读取请求体
async function readBody(event: H3Event): Promise<any> {
  try {
    // 尝试获取请求体
    const body = await new Promise((resolve) => {
      let data = '';
      event.req.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });
      event.req.on('end', () => {
        resolve(data);
      });
    });
    
    return body || null;
  } catch (error) {
    console.error('读取请求体失败:', error);
    return null;
  }
}
