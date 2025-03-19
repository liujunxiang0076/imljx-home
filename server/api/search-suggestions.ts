import { defineEventHandler, getQuery } from 'h3'

/**
 * 获取搜索建议的API端点
 * 支持参数:
 * - query: 搜索查询
 * - engine: 搜索引擎类型 (baidu, google, bing)
 */
export default defineEventHandler(async (event) => {
  try {
    // 获取查询参数
    const { query, engine = 'baidu' } = getQuery(event)

    // 验证必要参数
    if (!query) {
      return {
        success: false,
        error: '缺少搜索查询参数',
        suggestions: []
      }
    }

    // 根据不同搜索引擎获取建议
    let suggestions = []
    
    if (engine === 'baidu') {
      suggestions = await getBaiduSuggestions(query as string)
    } else if (engine === 'google') {
      suggestions = await getGoogleSuggestions(query as string)
    } else if (engine === 'bing') {
      suggestions = await getBingSuggestions(query as string)
    } else {
      suggestions = await getMockSuggestions(query as string)
    }

    return {
      success: true,
      engine,
      query,
      suggestions
    }
  } catch (error) {
    console.error('获取搜索建议错误:', error)
    return {
      success: false,
      error: '获取搜索建议失败',
      suggestions: []
    }
  }
})

/**
 * 获取百度搜索建议
 */
async function getBaiduSuggestions(query: string): Promise<string[]> {
  try {
    // 使用百度搜索建议API
    const url = `https://suggestion.baidu.com/su?wd=${encodeURIComponent(query)}&action=opensearch&ie=utf-8`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`获取百度搜索建议失败: ${response.status}`)
    }
    
    const data = await response.json()
    // 百度搜索建议API的响应格式: [查询词, [建议1, 建议2, ...]]
    return Array.isArray(data[1]) ? data[1] : []
  } catch (error) {
    console.error('百度搜索建议获取错误:', error)
    return getMockSuggestions(query, 'baidu')
  }
}

/**
 * 获取谷歌搜索建议
 */
async function getGoogleSuggestions(query: string): Promise<string[]> {
  try {
    // 谷歌搜索建议API可能需要代理
    const url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`
    
    // 注意：在生产环境中，你可能需要通过一个代理服务器来解决CORS问题
    // 这里为了简化，如果出错则返回模拟数据
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch Google suggestions')
      }
      
      const data = await response.json()
      // 谷歌搜索建议API的响应格式: [查询词, [建议1, 建议2, ...]]
      return Array.isArray(data[1]) ? data[1] : []
    } catch (error) {
      console.warn('无法直接访问谷歌API，使用模拟数据')
      return getMockSuggestions(query, 'google')
    }
  } catch (error) {
    console.error('谷歌搜索建议获取错误:', error)
    return getMockSuggestions(query, 'google')
  }
}

/**
 * 获取Bing搜索建议
 */
async function getBingSuggestions(query: string): Promise<string[]> {
  // Bing的搜索建议API需要特殊处理，这里使用模拟数据
  return getMockSuggestions(query, 'bing')
}

/**
 * 获取模拟搜索建议
 */
function getMockSuggestions(query: string, engineType = ''): string[] {
  if (!query.trim()) return []
  
  // 针对不同引擎提供不同风格的建议
  let mockData: string[] = []
  
  if (engineType === 'baidu') {
    mockData = [
      `${query}怎么用`,
      `${query}官网`,
      `${query}下载`,
      `${query}教程`,
      `${query}和竞品对比`,
      `${query}最新版本`,
      `${query}中文文档`,
      `${query}社区`
    ]
  } else if (engineType === 'google') {
    mockData = [
      `${query} tutorial`,
      `${query} download`,
      `${query} github`,
      `${query} documentation`,
      `${query} examples`,
      `${query} vs code`,
      `${query} api`,
      `${query} community`
    ]
  } else if (engineType === 'bing') {
    mockData = [
      `${query} how to use`,
      `${query} best practices`,
      `${query} tips and tricks`,
      `${query} for beginners`,
      `${query} advanced techniques`,
      `${query} official site`,
      `${query} alternatives`
    ]
  } else {
    mockData = [
      `${query} 教程`,
      `${query} 下载`,
      `${query} 官网`,
      `${query} 是什么`,
      `${query} 最新版本`,
      `${query} 怎么用`,
      `${query} 和其他工具的区别`,
      `${query} 入门指南`
    ]
  }
  
  // 返回5-8个建议
  const count = Math.min(mockData.length, Math.floor(Math.random() * 3) + 5)
  return mockData.slice(0, count)
} 
