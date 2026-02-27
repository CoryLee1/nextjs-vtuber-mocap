/**
 * Backfill script: scan S3 prefixes and upsert records into the assets table.
 * Usage: node scripts/backfill-s3-assets.mjs
 *
 * Set PUBLIC visibility for default/preload assets so unauthenticated users
 * can load the default VRM and animations on first visit.
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'nextjs-vtuber-assets';
const REGION = process.env.NEXT_PUBLIC_S3_REGION || 'us-east-2';

const PREFIXES = ['vrm/', 'animations/', 'bgm/', 'hdr/', 'scene/'];

// Keys that should be PUBLIC (default/preload resources)
const PUBLIC_KEYS = new Set([
  'vrm/AvatarSample_A.vrm',
  'animations/Standing Greeting (1).fbx',
  'animations/Idle.fbx',
  'animations/Talking.fbx',
  'animations/Thinking.fbx',
  'animations/Disappointed.fbx',
  'animations/Bashful.fbx',
  'animations/Listening To Music.fbx',
]);

const ASSET_TYPE_MAP = {
  'vrm/': 'VRM',
  'animations/': 'ANIMATION',
  'bgm/': 'BGM',
  'hdr/': 'HDR',
  'scene/': 'SCENE',
};

// Skip thumbnails, meta files, and bare prefix keys
function shouldSkip(key) {
  if (!key) return true;
  if (/_thumb\.(png|jpe?g|webp)$/i.test(key)) return true;
  if (/_meta\.json$/i.test(key)) return true;
  if (PREFIXES.includes(key)) return true; // bare prefix itself
  return false;
}

function getAssetType(key) {
  for (const [prefix, type] of Object.entries(ASSET_TYPE_MAP)) {
    if (key.startsWith(prefix)) return type;
  }
  return 'OTHER';
}

async function listAllObjects(s3, prefix) {
  const keys = [];
  let continuationToken;
  do {
    const cmd = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });
    const res = await s3.send(cmd);
    for (const obj of res.Contents ?? []) {
      keys.push(obj.Key);
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);
  return keys;
}

async function main() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    console.error('ERROR: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set');
    process.exit(1);
  }

  const s3 = new S3Client({ region: REGION, credentials: { accessKeyId, secretAccessKey } });

  let scanned = 0;
  let upserted = 0;
  let skipped = 0;

  for (const prefix of PREFIXES) {
    console.log(`Scanning s3://${BUCKET}/${prefix} ...`);
    const keys = await listAllObjects(s3, prefix);

    for (const key of keys) {
      scanned++;
      if (shouldSkip(key)) {
        skipped++;
        continue;
      }

      const assetType = getAssetType(key);
      const visibility = PUBLIC_KEYS.has(key) ? 'PUBLIC' : 'PRIVATE';

      await prisma.asset.upsert({
        where: { s3Key: key },
        update: { status: 'ACTIVE', visibility },
        create: { s3Key: key, assetType, status: 'ACTIVE', visibility, userId: null },
      });

      upserted++;
      console.log(`  [${visibility}] ${key}`);
    }
  }

  console.log(`\nDone. scanned=${scanned}  upserted=${upserted}  skipped=${skipped}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
