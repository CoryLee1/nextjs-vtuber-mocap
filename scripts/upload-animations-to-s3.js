#!/usr/bin/env node
/**
 * 将 public/models/animations 下的所有 .fbx 上传到 S3 animations/ 前缀
 * 需要 .env 中配置：AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, NEXT_PUBLIC_S3_BUCKET, NEXT_PUBLIC_S3_REGION
 *
 * 403 Forbidden：前端直接请求 S3 链接需桶或对象允许公开读。
 * - 方式一：上传时设置 ACL: 'public-read'（见下方），且桶的「阻止公共访问」中允许通过 ACL 授予公共读；
 * - 方式二：桶策略对 animations/* 允许 s3:GetObject 给 Principal "*"。
 */
const fs = require('fs');
const path = require('path');

// 从项目根目录加载 .env 和 .env.local（兼容无 dotenv 时简单解析）
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) {
      const key = m[1];
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  }
}
const root = path.join(__dirname, '..');
loadEnvFile(path.join(root, '.env'));
loadEnvFile(path.join(root, '.env.local'));

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'nextjs-vtuber-assets';
const REGION = process.env.NEXT_PUBLIC_S3_REGION || 'us-east-2';
const ANIM_DIR = path.join(__dirname, '..', 'public', 'models', 'animations');

async function main() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('请在 .env 中配置 AWS_ACCESS_KEY_ID 和 AWS_SECRET_ACCESS_KEY');
    process.exit(1);
  }

  if (!fs.existsSync(ANIM_DIR)) {
    console.error('目录不存在:', ANIM_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(ANIM_DIR).filter((f) => f.toLowerCase().endsWith('.fbx'));
  if (files.length === 0) {
    console.log('未找到 .fbx 文件');
    return;
  }

  const s3 = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  console.log(`准备上传 ${files.length} 个动画到 S3 (${BUCKET}, animations/)`);
  for (const name of files) {
    const filePath = path.join(ANIM_DIR, name);
    const body = fs.readFileSync(filePath);
    const key = `animations/${name}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: 'application/octet-stream',
        ACL: 'public-read', // 前端直连 S3 需公开读；若桶禁止 ACL 则改用桶策略对 animations/* 开放 GetObject
      })
    );
    console.log('  OK', key);
  }
  console.log('全部上传完成.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
