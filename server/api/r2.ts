import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { defineEventHandler, readBody, getQuery } from 'h3';
import { NodeHttpHandler } from '@smithy/node-http-handler';

// 检查网络连接状态
async function checkNetworkConnection() {
  // 多个可以尝试连接的目标
  const targets = [
    'https://1.1.1.1',
    'https://www.baidu.com',
    'https://cloudflare.com'
  ];
  
  // 增加超时时间
  const timeout = 10000; // 10秒
  
  // 尝试连接多个目标，只要有一个成功即可
  for (const target of targets) {
    try {
      console.log(`尝试连接到: ${target}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(target, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`成功连接到: ${target}`);
        return true;
      }
    } catch (error) {
      console.warn(`连接到 ${target} 失败:`, error instanceof Error ? error.message : String(error));
      // 继续尝试下一个目标
    }
  }
  
  console.warn('所有网络连接测试都失败了');
  return false;
}

// 创建S3客户端
const createS3Client = (config: {
  accessKeyId: string;
  secretKey: string;
  endpoint: string;
}) => {
  return new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretKey
    },
    maxAttempts: 5, // 增加最大尝试次数
    // AWS SDK默认提供的重试模式，不需要自定义retryStrategy
    retryMode: 'adaptive', 
    // 自定义超时时间
    requestHandler: new NodeHttpHandler({
      connectionTimeout: 20000, // 连接超时：20秒
      socketTimeout: 30000 // 套接字超时：30秒
    })
  });
};

// 获取默认配置（仅从环境变量）
const getDefaultConfig = () => {
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
  const secretKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || '';
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || '';
  
  return {
    accessKeyId,
    secretKey,
    bucketName,
    endpoint,
    hasConfig: !!(accessKeyId && secretKey && bucketName && endpoint)
  };
};

// 从环境变量或请求体获取配置
const getConfig = async (event: any) => {
  // 尝试从请求体获取配置
  let body: any = {};
  try {
    body = await readBody(event);
  } catch (error) {
    // 如果读取请求体失败，使用空对象
    body = {};
  }
  
  // 获取环境变量配置
  const envConfig = getDefaultConfig();
  
  // 优先使用请求体中的配置，如果没有则使用环境变量中的配置
  return {
    accessKeyId: body.accessKeyId || envConfig.accessKeyId,
    secretKey: body.secretKey || envConfig.secretKey,
    bucketName: body.bucketName || envConfig.bucketName,
    endpoint: body.endpoint || envConfig.endpoint,
    prefix: body.prefix || '',
    fileName: body.fileName || '',
    contentType: body.contentType || ''
  };
};

// 带重试逻辑的执行函数
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    operationName?: string;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    operationName = '操作'
  } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 尝试执行操作
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // 记录错误和重试信息
      console.warn(
        `${operationName}失败 (尝试 ${attempt}/${maxRetries}): ${error.message || error}`
      );
      
      // 检查是否是网络相关错误
      const isNetworkError = 
        error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.name === 'NetworkingError' ||
        (error.message && (
          error.message.includes('network') || 
          error.message.includes('timeout') || 
          error.message.includes('connection')
        ));
      
      // 非网络错误不重试
      if (!isNetworkError) {
        console.log(`非网络错误，不再重试: ${error.code || error.name}`);
        throw error;
      }
      
      // 如果还有重试次数，则等待后重试
      if (attempt < maxRetries) {
        const currentDelay = retryDelay * Math.pow(1.5, attempt - 1); // 指数退避
        console.log(`等待 ${currentDelay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        
        // 在重试前检查网络连接
        const isConnected = await checkNetworkConnection();
        if (!isConnected) {
          console.warn('网络连接检查失败，但仍将尝试重试操作');
        }
      }
    }
  }
  
  // 如果所有重试都失败了，抛出最后一个错误
  throw lastError || new Error(`${operationName}失败，已达到最大重试次数`);
}

// API处理程序
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const action = query.action as string;

  try {
    // 获取默认配置
    if (action === 'getDefaultConfig') {
      const config = getDefaultConfig();
      
      // 出于安全考虑，返回部分密钥信息
      let maskedSecretKey = '';
      if (config.secretKey) {
        // 只显示前4位和后4位，中间用星号替代
        const keyLength = config.secretKey.length;
        if (keyLength > 8) {
          maskedSecretKey = config.secretKey.substring(0, 4) + 
            '*'.repeat(keyLength - 8) + 
            config.secretKey.substring(keyLength - 4);
        } else {
          maskedSecretKey = '********'; // 密钥太短，全部隐藏
        }
      }
      
      // 安全返回的配置
      const secureConfig = {
        accessKeyId: config.accessKeyId,
        secretKey: config.secretKey ? maskedSecretKey : '',
        bucketName: config.bucketName,
        endpoint: config.endpoint,
        hasConfig: config.hasConfig
      };
      
      return {
        success: true,
        config: secureConfig
      };
    }
    
    // 获取配置
    const config = await getConfig(event);
    
    // 测试连接
    if (action === 'testConnection') {
      // 验证配置
      if (!config.accessKeyId || !config.secretKey || !config.endpoint || !config.bucketName) {
        return { 
          success: false, 
          error: '配置不完整，请提供所有必要的参数' 
        };
      }
      
      try {
        // 先检查网络连接
        const isNetworkConnected = await checkNetworkConnection();
        if (!isNetworkConnected) {
          return {
            success: false,
            error: '无法连接到网络。请检查您的网络连接并重试。',
            networkStatus: 'disconnected'
          };
        }
        
        // 创建S3客户端
        const s3Client = createS3Client({
          accessKeyId: config.accessKeyId,
          secretKey: config.secretKey,
          endpoint: config.endpoint
        });
        
        // 使用带重试的执行函数来测试连接
        await executeWithRetry(
          async () => {
            const command = new ListObjectsV2Command({
              Bucket: config.bucketName,
              MaxKeys: 1
            });
            
            return await s3Client.send(command);
          },
          {
            maxRetries: 3,
            operationName: '测试连接'
          }
        );
        
        return { 
          success: true, 
          message: `成功连接到存储桶 "${config.bucketName}"` 
        };
      } catch (error: any) {
        // 处理可能的错误
        console.error('测试连接失败:', error);
        return {
          success: false,
          error: `测试连接失败: ${error.message || '未知错误'}`,
          errorCode: error.code || error.name || 'UNKNOWN'
        };
      }
    }
    
    // 列出所有对象
    else if (action === 'list') {
      // 验证配置
      if (!config.accessKeyId || !config.secretKey || !config.endpoint || !config.bucketName) {
        return { 
          success: false, 
          error: '配置不完整，请提供所有必要的参数' 
        };
      }
      
      try {
        // 先检查网络连接
        const isNetworkConnected = await checkNetworkConnection();
        if (!isNetworkConnected) {
          return {
            success: false,
            error: '无法连接到网络。请检查您的网络连接并重试。',
            networkStatus: 'disconnected'
          };
        }
        
        // 创建S3客户端
        const s3Client = createS3Client({
          accessKeyId: config.accessKeyId,
          secretKey: config.secretKey,
          endpoint: config.endpoint
        });
        
        // 使用带重试的执行函数
        const response = await executeWithRetry(
          async () => {
            const command = new ListObjectsV2Command({
              Bucket: config.bucketName,
              // 如果有前缀，则添加到请求中
              ...(config.prefix ? { Prefix: config.prefix + '/' } : {})
            });
            
            return await s3Client.send(command);
          },
          {
            maxRetries: 3,
            operationName: '列出对象'
          }
        );
        
        return { success: true, objects: response.Contents || [] };
      } catch (error: any) {
        console.error('列出对象失败:', error);
        return {
          success: false,
          error: `列出对象失败: ${error.message || '未知错误'}`,
          errorCode: error.code || error.name || 'UNKNOWN'
        };
      }
    }
    
    // 创建文件夹
    else if (action === 'createFolder') {
      // 验证配置和参数
      if (!config.accessKeyId || !config.secretKey || !config.endpoint || !config.bucketName) {
        return { 
          success: false, 
          error: '配置不完整，请提供所有必要的参数' 
        };
      }
      
      // 从请求体中获取文件夹路径
      const body = await readBody(event);
      const folderPath = body.folderPath;
      
      if (!folderPath) {
        return { 
          success: false, 
          error: '缺少文件夹路径' 
        };
      }
      
      // 创建S3客户端
      const s3Client = createS3Client({
        accessKeyId: config.accessKeyId,
        secretKey: config.secretKey,
        endpoint: config.endpoint
      });
      
      // 确保文件夹路径末尾有斜杠，并创建一个空的.folder文件
      const folderKey = folderPath.endsWith('/') ? `${folderPath}.folder` : `${folderPath}/.folder`;
      
      try {
        // 使用PutObject创建一个空文件作为文件夹标记
        const command = new PutObjectCommand({
          Bucket: config.bucketName,
          Key: folderKey,
          Body: '',
          ContentType: 'application/x-directory'
        });
        
        await s3Client.send(command);
        
        return {
          success: true,
          message: `文件夹 ${folderPath} 创建成功`
        };
      } catch (error: any) {
        console.error('创建文件夹失败:', error);
        return {
          success: false,
          error: `创建文件夹失败: ${error.message}`,
          errorCode: error.code || 'UNKNOWN'
        };
      }
    }
    
    // 获取预签名上传URL
    else if (action === 'getUploadUrl') {
      // 验证配置和参数
      if (!config.accessKeyId || !config.secretKey || !config.endpoint || !config.bucketName) {
        return { 
          success: false, 
          error: '配置不完整，请提供所有必要的参数' 
        };
      }
      
      if (!config.fileName) {
        return { 
          success: false, 
          error: '缺少文件名' 
        };
      }
      
      // 创建S3客户端
      const s3Client = createS3Client({
        accessKeyId: config.accessKeyId,
        secretKey: config.secretKey,
        endpoint: config.endpoint
      });
      
      const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: config.fileName,
        ContentType: config.contentType || 'application/octet-stream'
      });
      
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      
      return {
        success: true,
        uploadUrl: signedUrl,
        fileName: config.fileName
      };
    }
    
    // 获取预签名下载URL
    else if (action === 'getDownloadUrl') {
      // 验证配置和参数
      if (!config.accessKeyId || !config.secretKey || !config.endpoint || !config.bucketName) {
        return { 
          success: false, 
          error: '配置不完整，请提供所有必要的参数' 
        };
      }
      
      if (!config.fileName) {
        return { 
          success: false, 
          error: '缺少文件名' 
        };
      }
      
      // 创建S3客户端
      const s3Client = createS3Client({
        accessKeyId: config.accessKeyId,
        secretKey: config.secretKey,
        endpoint: config.endpoint
      });
      
      const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: config.fileName,
        // 添加Content-Disposition以确保正确的文件名
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(config.fileName.split('/').pop() || config.fileName)}"`
      });
      
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      
      return {
        success: true,
        downloadUrl: signedUrl,
        fileName: config.fileName
      };
    }
    
    // 删除对象
    else if (action === 'delete') {
      // 验证配置和参数
      if (!config.accessKeyId || !config.secretKey || !config.endpoint || !config.bucketName) {
        return { 
          success: false, 
          error: '配置不完整，请提供所有必要的参数' 
        };
      }
      
      if (!config.fileName) {
        return { 
          success: false, 
          error: '缺少文件名' 
        };
      }
      
      // 创建S3客户端
      const s3Client = createS3Client({
        accessKeyId: config.accessKeyId,
        secretKey: config.secretKey,
        endpoint: config.endpoint
      });
      
      const command = new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: config.fileName
      });
      
      await s3Client.send(command);
      
      return {
        success: true,
        message: `文件 ${config.fileName} 已成功删除`
      };
    }
    
    // 删除文件夹（删除文件夹下的所有对象）
    else if (action === 'deleteFolder') {
      // 验证配置和参数
      if (!config.accessKeyId || !config.secretKey || !config.endpoint || !config.bucketName) {
        return { 
          success: false, 
          error: '配置不完整，请提供所有必要的参数' 
        };
      }
      
      if (!config.fileName) {
        return { 
          success: false, 
          error: '缺少文件夹路径' 
        };
      }
      
      // 创建S3客户端
      const s3Client = createS3Client({
        accessKeyId: config.accessKeyId,
        secretKey: config.secretKey,
        endpoint: config.endpoint
      });
      
      // 确保文件夹路径末尾有斜杠
      const folderPath = config.fileName.endsWith('/') ? config.fileName : `${config.fileName}/`;
      
      // 首先列出文件夹中的所有对象
      const listCommand = new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: folderPath
      });
      
      const response = await s3Client.send(listCommand);
      
      if (!response.Contents || response.Contents.length === 0) {
        return { success: true, message: '文件夹为空或不存在' };
      }
      
      // 对每个对象执行删除操作
      const deletePromises = response.Contents.map(async (obj) => {
        if (!obj.Key) return;
        
        const deleteCommand = new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: obj.Key
        });
        
        await s3Client.send(deleteCommand);
      });
      
      await Promise.all(deletePromises);
      
      return {
        success: true,
        message: `文件夹 ${config.fileName} 及其所有内容已成功删除`
      };
    }
    
    return {
      success: false,
      error: '无效的操作'
    };
  } catch (error: any) {
    // 增强的错误日志记录
    console.error('R2 API 错误:', error);
    console.error('错误详情:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
      action: action
    });
    
    // 处理网络和连接错误
    const networkErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'NetworkingError', 'TimeoutError'];
    if (networkErrors.includes(error.code) || networkErrors.includes(error.name)) {
      console.warn('检测到网络错误:', error.code || error.name);
      
      // 尝试确定更具体的错误原因
      let errorMessage = '网络连接问题。';
      let suggestion = '请检查您的网络连接并重试。';
      
      if (error.code === 'ECONNRESET') {
        errorMessage = '连接被重置 (ECONNRESET)。';
        suggestion = '可能是网络问题、代理拦截或防火墙限制导致。请检查网络设置、尝试使用不同的网络环境或稍后重试。';
      } else if (error.code === 'ETIMEDOUT' || error.name === 'TimeoutError') {
        errorMessage = '连接超时。';
        suggestion = '服务器响应时间过长或网络延迟高。请检查网络速度并尝试稍后重试。';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = '无法解析主机名。';
        suggestion = '请检查端点URL是否正确，以及DNS设置是否配置正确。';
      }
      
      return {
        success: false,
        error: errorMessage + ' ' + suggestion,
        errorDetails: {
          code: error.code || error.name,
          message: error.message,
          suggestion: '如果问题持续出现，请检查Cloudflare R2的可用性或网络代理设置。'
        },
        actionTaken: '已自动重试连接，但仍然失败。'
      };
    }
    
    // 处理授权错误
    if (error.name === 'SignatureDoesNotMatch' || error.code === 'AuthorizationHeaderMalformed') {
      return {
        success: false,
        error: '签名验证失败。请确保Access Key和Secret Key正确配对，并检查端点URL格式。',
        suggestedAction: '重新检查您的R2凭证和端点URL配置。'
      };
    }
    
    // 处理DNS解析错误
    if (error.message && error.message.includes('getaddrinfo')) {
      return {
        success: false,
        error: '无法解析服务器地址。请检查终端节点URL是否正确，以及网络DNS设置。',
        suggestedAction: '请确认您的互联网连接可用，并且DNS服务器可以正常解析域名。'
      };
    }
    
    // 其他未知错误
    return {
      success: false,
      error: error.message || '未知错误',
      errorCode: error.code || 'UNKNOWN'
    };
  }
}); 
