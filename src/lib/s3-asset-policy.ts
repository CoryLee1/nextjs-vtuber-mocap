import { AssetStatus, AssetType, AssetVisibility, type Asset } from '@prisma/client';

type UploadFolder = 'vrm' | 'animations' | 'bgm' | 'hdr' | 'scene';

const FOLDER_TO_ASSET_TYPE: Record<UploadFolder, AssetType> = {
  vrm: AssetType.VRM,
  animations: AssetType.ANIMATION,
  bgm: AssetType.BGM,
  hdr: AssetType.HDR,
  scene: AssetType.SCENE,
};

function safeDecodeURIComponent(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/^.*[\\/]/, '').trim();
  const cleaned = base.replace(/[^\w.\- ]+/g, '_').replace(/\s+/g, ' ');
  return cleaned || 'file.bin';
}

function getExtension(name: string): string {
  const match = /\.([^.]+)$/.exec(name);
  return match ? match[1].toLowerCase() : '';
}

function displayNameFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '');
}

function folderFromInput(rawKey: string, fallbackName: string): UploadFolder {
  const decoded = safeDecodeURIComponent(rawKey || '').replace(/^\/+/, '');
  const parts = decoded.split('/').filter(Boolean);
  const first = parts[0]?.toLowerCase() || '';
  if (first === 'user' && parts.length >= 3) {
    const scopedFolder = parts[2]?.toLowerCase() || '';
    if (scopedFolder === 'vrm') return 'vrm';
    if (scopedFolder === 'animations' || scopedFolder === 'fbx') return 'animations';
    if (scopedFolder === 'bgm') return 'bgm';
    if (scopedFolder === 'hdr') return 'hdr';
    if (scopedFolder === 'scene') return 'scene';
  }
  if (first === 'vrm') return 'vrm';
  if (first === 'animations' || first === 'fbx') return 'animations';
  if (first === 'bgm') return 'bgm';
  if (first === 'hdr') return 'hdr';
  if (first === 'scene') return 'scene';

  const ext = getExtension(fallbackName);
  if (ext === 'vrm') return 'vrm';
  if (ext === 'fbx') return 'animations';
  if (ext === 'mp3') return 'bgm';
  if (ext === 'hdr' || ext === 'png' || ext === 'jpg' || ext === 'jpeg') return 'hdr';
  if (ext === 'glb' || ext === 'gltf') return 'scene';
  return 'animations';
}

export function buildUserScopedS3Key(userId: string, rawKey: string, fallbackName: string): {
  key: string;
  folder: UploadFolder;
  assetType: AssetType;
  displayName: string;
} {
  const folder = folderFromInput(rawKey, fallbackName);
  const decoded = safeDecodeURIComponent(rawKey || '').replace(/^\/+/, '');
  const parts = decoded.split('/').filter(Boolean);
  const rawTail = parts[parts.length - 1] || fallbackName;
  const safeName = sanitizeFilename(rawTail || fallbackName);
  const key = `user/${userId}/${folder}/${safeName}`;
  return {
    key,
    folder,
    assetType: FOLDER_TO_ASSET_TYPE[folder],
    displayName: displayNameFromFileName(safeName),
  };
}

export function getModelThumbnailKey(modelKey: string): string | null {
  if (!/\.vrm$/i.test(modelKey)) return null;
  return modelKey.replace(/\.vrm$/i, '_thumb.png');
}

export function isAssetReadableByUser(
  asset: Pick<Asset, 'visibility' | 'ownerUserId'> | null | undefined,
  userId: string | null
): boolean {
  if (!asset) return false;
  if (asset.visibility === AssetVisibility.PUBLIC) return true;
  if (!userId) return false;
  return asset.ownerUserId === userId;
}

export function mapResourceTypeToAssetType(resourceType: string | null): AssetType | null {
  if (resourceType === 'models') return AssetType.VRM;
  if (resourceType === 'animations') return AssetType.ANIMATION;
  if (resourceType === 'bgm') return AssetType.BGM;
  if (resourceType === 'hdr') return AssetType.HDR;
  if (resourceType === 'scene') return AssetType.SCENE;
  return null;
}

export function isQueryableAssetStatus(status: AssetStatus): boolean {
  return status === AssetStatus.READY || status === AssetStatus.MISSING;
}
