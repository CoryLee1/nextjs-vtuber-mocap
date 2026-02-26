#!/usr/bin/env node

import { PrismaClient, AssetType, AssetStatus, AssetVisibility } from '@prisma/client';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();

const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;
const region = process.env.NEXT_PUBLIC_S3_REGION || 'us-east-2';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!bucket || !accessKeyId || !secretAccessKey) {
  console.error('Missing required env vars: NEXT_PUBLIC_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
  process.exit(1);
}

const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

function guessMimeType(key) {
  const lower = key.toLowerCase();
  if (lower.endsWith('.vrm')) return 'model/vrm';
  if (lower.endsWith('.fbx')) return 'application/octet-stream';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.hdr')) return 'image/vnd.radiance';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gltf')) return 'model/gltf+json';
  if (lower.endsWith('.glb')) return 'model/gltf-binary';
  return 'application/octet-stream';
}

function displayNameFromKey(key) {
  const filename = key.split('/').pop() || key;
  return filename.replace(/\.[^.]+$/, '');
}

function resolveAssetInfo(key) {
  const parts = key.split('/');
  if (parts.length >= 4 && parts[0] === 'user') {
    const ownerUserId = parts[1];
    const folder = parts[2];
    const type = mapFolderToType(folder);
    if (!type) return null;
    return {
      type,
      ownerUserId,
      visibility: AssetVisibility.PRIVATE,
    };
  }

  const folder = parts[0];
  const type = mapFolderToType(folder);
  if (!type) return null;
  return {
    type,
    ownerUserId: null,
    visibility: AssetVisibility.PUBLIC,
  };
}

function mapFolderToType(folder) {
  if (folder === 'vrm') return AssetType.VRM;
  if (folder === 'animations' || folder === 'fbx') return AssetType.ANIMATION;
  if (folder === 'bgm') return AssetType.BGM;
  if (folder === 'hdr') return AssetType.HDR;
  if (folder === 'scene') return AssetType.SCENE;
  return null;
}

async function run() {
  let continuationToken = undefined;
  let scanned = 0;
  let upserted = 0;
  let skipped = 0;

  do {
    const page = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      })
    );

    const objects = page.Contents || [];
    for (const object of objects) {
      if (!object.Key) continue;
      scanned++;

      const info = resolveAssetInfo(object.Key);
      if (!info) {
        skipped++;
        continue;
      }

      await prisma.asset.upsert({
        where: { s3Key: object.Key },
        update: {
          type: info.type,
          displayName: displayNameFromKey(object.Key),
          mimeType: guessMimeType(object.Key),
          sizeBytes: Number.isFinite(object.Size) ? Number(object.Size) : null,
          status: AssetStatus.READY,
          ownerUserId: info.ownerUserId,
          visibility: info.visibility,
          errorCode: null,
        },
        create: {
          s3Key: object.Key,
          type: info.type,
          displayName: displayNameFromKey(object.Key),
          mimeType: guessMimeType(object.Key),
          sizeBytes: Number.isFinite(object.Size) ? Number(object.Size) : null,
          status: AssetStatus.READY,
          ownerUserId: info.ownerUserId,
          visibility: info.visibility,
        },
      });
      upserted++;
    }

    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);

  console.log(
    JSON.stringify(
      {
        scanned,
        upserted,
        skipped,
      },
      null,
      2
    )
  );
}

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

