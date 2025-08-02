// S3 预签名 URL API
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileType, bucketName } = req.body;

    if (!fileName || !fileType || !bucketName) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // 创建 PutObject 命令
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      ContentType: fileType,
    });

    // 生成预签名 URL（15分钟有效期）
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // 15 minutes
    });

    res.status(200).json({
      presignedUrl,
      fileName,
      fileType,
      bucketName,
    });

  } catch (error) {
    console.error('S3 预签名 URL 生成失败:', error);
    res.status(500).json({ 
      error: 'Failed to generate presigned URL',
      details: error.message 
    });
  }
} 