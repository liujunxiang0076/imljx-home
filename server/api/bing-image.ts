import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    // 请求Bing图片API
    const response = await fetch(
      'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN'
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 返回处理后的数据
    if (data && data.images && data.images.length > 0) {
      const image = data.images[0]
      return {
        url: `https://www.bing.com${image.url}`,
        copyright: image.copyright,
        title: image.title
      }
    }
    
    return {
      error: 'No image data found'
    }
  } catch (error) {
    console.error('Error fetching Bing image:', error)
    return {
      error: 'Failed to fetch Bing image',
      message: error instanceof Error ? error.message : String(error)
    }
  }
}) 
