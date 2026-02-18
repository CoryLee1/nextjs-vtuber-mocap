#!/usr/bin/env node
/**
 * 列出 S3 里 animations/ 和 fbx/ 下的所有 .fbx 动画
 * 需要 .env 中配置：AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, NEXT_PUBLIC_S3_BUCKET, NEXT_PUBLIC_S3_REGION
 */
const fs = require('fs');
const path = require('path');

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

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'nextjs-vtuber-assets';
const REGION = process.env.NEXT_PUBLIC_S3_REGION || 'us-east-2';
const BASE_URL = process.env.NEXT_PUBLIC_S3_BASE_URL || `https://${BUCKET}.s3.${REGION}.amazonaws.com`;

async function main() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('请在 .env 中配置 AWS_ACCESS_KEY_ID 和 AWS_SECRET_ACCESS_KEY');
    process.exit(1);
  }

  const s3 = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const prefixes = ['animations/', 'fbx/'];
  const all = [];

  for (const prefix of prefixes) {
    let continuationToken;
    do {
      const cmd = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });
      const res = await s3.send(cmd);
      if (res.Contents) {
        for (const obj of res.Contents) {
          if (obj.Key && obj.Key.toLowerCase().endsWith('.fbx')) {
            all.push({
              key: obj.Key,
              size: obj.Size,
              lastModified: obj.LastModified,
            });
          }
        }
      }
      continuationToken = res.NextContinuationToken;
    } while (continuationToken);
  }

  all.sort((a, b) => a.key.localeCompare(b.key));

  console.log(`S3 Bucket: ${BUCKET}`);
  console.log(`FBX 动画数量: ${all.length}\n`);
  if (all.length === 0) {
    console.log('(无)');
    return;
  }
  for (const f of all) {
    const size = f.size != null ? `  ${(f.size / 1024).toFixed(1)} KB` : '';
    const date = f.lastModified ? `  ${f.lastModified.toISOString().slice(0, 19)}Z` : '';
    console.log(f.key + size + date);
  }
  console.log('\n--- 可直接用的 URL ---');
  for (const f of all) {
    console.log(`${BASE_URL}/${f.key}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
