import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { defineEventHandler, readBody, getQuery } from 'h3';
import { NodeHttpHandler } from '@smithy/node-http-handler';

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
    // 增加重试机制
    maxAttempts: 3,
    // 自定义超时时间
    requestHandler: new NodeHttpHandler({
      connectionTimeout: 10000, // 连接超时：10秒
      socketTimeout: 15000 // 套接字超时：15秒
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
    endpoint: body.endpoint || envConfig.endpoint
  };
};

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
      
      // 创建S3客户端
      const s3Client = createS3Client({
        accessKeyId: config.accessKeyId,
        secretKey: config.secretKey,
        endpoint: config.endpoint
      });
      
      // 尝试列出对象以测试连接
      const command = new ListObjectsV2Command({
        Bucket: config.bucketName,
        MaxKeys: 1
      });
      
      await s3Client.send(command);
      
      return { 
        success: true, 
        message: `成功连接到存储桶 "${config.bucketName}"` 
      };
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
      
      // 创建S3客户端
      const s3Client = createS3Client({
        accessKeyId: config.accessKeyId,
        secretKey: config.secretKey,
        endpoint: config.endpoint
      });
      
      const command = new ListObjectsV2Command({
        Bucket: config.bucketName,
      });
      
      const response = await s3Client.send(command);
      return { success: true, objects: response.Contents || [] };
    }
    
    // 获取预签名上传URL
    else if (action === 'getUploadUrl') {
      const { fileName, contentType } = await readBody(event);
      
      // 验证配置和参数
      if (!config.accessKeyId || !config.secretKey || !config.endpoint || !config.bucketName) {
        return { 
          success: false, 
          error: '配置不完整，请提供所有必要的参数' 
        };
      }
      
      if (!fileName) {
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
        Key: fileName,
        ContentType: contentType || 'application/octet-stream'
      });
      
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      
      return {
        success: true,
        uploadUrl: signedUrl,
        fileName: fileName
      };
    }
    
    // 获取预签名下载URL
    else if (action === 'getDownloadUrl') {
      const { fileName } = await readBody(event);
      
      // 验证配置和参数
      if (!config.accessKeyId || !config.secretKey || !config.endpoint || !config.bucketName) {
        return { 
          success: false, 
          error: '配置不完整，请提供所有必要的参数' 
        };
      }
      
      if (!fileName) {
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
        Key: fileName
      });
      
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      
      return {
        success: true,
        downloadUrl: signedUrl,
        fileName: fileName
      };
    }
    
    // 删除对象
    else if (action === 'delete') {
      const { fileName } = await readBody(event);
      
      // 验证配置和参数
      if (!config.accessKeyId || !config.secretKey || !config.endpoint || !config.bucketName) {
        return { 
          success: false, 
          error: '配置不完整，请提供所有必要的参数' 
        };
      }
      
      if (!fileName) {
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
        Key: fileName
      });
      
      await s3Client.send(command);
      
      return {
        success: true,
        message: `文件 ${fileName} 已成功删除`
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
    
    // 处理特定类型的错误
    if (error.code === 'ECONNRESET') {
      return {
        success: false,
        error: '连接被重置 (ECONNRESET)。可能是网络问题、代理拦截或防火墙限制导致。请检查网络设置或尝试使用不同的网络环境。'
      };
    }
    
    if (error.name === 'SignatureDoesNotMatch') {
      return {
        success: false,
        error: '签名验证失败。请确保Access Key和Secret Key正确配对，并检查端点URL格式。'
      };
    }
    
    if (error.message && error.message.includes('getaddrinfo')) {
      return {
        success: false,
        error: '无法解析服务器地址。请检查终端节点URL是否正确，以及网络DNS设置。'
      };
    }
    
    return {
      success: false,
      error: error.message || '未知错误',
      errorCode: error.code || 'UNKNOWN'
    };
  }
}); 
