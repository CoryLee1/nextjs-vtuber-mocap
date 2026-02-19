/**
 * 从 VRM (GLB) 中解析 meta.thumbnailImage，取出缩略图二进制。
 * 支持 VRM 1.0 (VRMC_vrm.meta.thumbnailImage) 与 VRM 0.x (VRM.meta.texture)。
 */

const GLB_MAGIC = 0x46546c67; // 'glTF'
const GLB_CHUNK_JSON = 0x4e4f534a; // 'JSON'
const GLB_CHUNK_BIN = 0x004e4942; // 'BIN'
const MAX_VRM_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_THUMB_SIZE = 2 * 1024 * 1024; // 2MB

export interface VrmThumbnailResult {
  data: ArrayBuffer;
  mimeType: string;
}

function parseGlbChunks(buffer: ArrayBuffer): { json: any; bin: ArrayBuffer | null } {
  const view = new DataView(buffer);
  if (buffer.byteLength < 12) throw new Error('GLB too short');
  const magic = view.getUint32(0, true);
  if (magic !== GLB_MAGIC) throw new Error('Invalid GLB magic');
  const version = view.getUint32(4, true);
  if (version !== 2) throw new Error('Unsupported GLB version');
  const length = view.getUint32(8, true);
  if (buffer.byteLength < length) throw new Error('GLB truncated');

  let offset = 12;
  let json: any = null;
  let bin: ArrayBuffer | null = null;

  while (offset < length) {
    if (offset + 8 > length) break;
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    offset += 8;
    if (offset + chunkLength > length) break;
    const chunkData = buffer.slice(offset, offset + chunkLength);
    offset += chunkLength;
    if (chunkType === GLB_CHUNK_JSON) {
      const text = new TextDecoder().decode(chunkData);
      json = JSON.parse(text);
    } else if (chunkType === GLB_CHUNK_BIN) {
      bin = chunkData;
    }
  }

  if (!json) throw new Error('GLB has no JSON chunk');
  return { json, bin };
}

/** 从 glTF JSON 中解析 VRM 缩略图对应的 image 索引 */
function getThumbnailImageIndex(json: any): number | null {
  const extVrm1 = json.extensions?.['VRMC_vrm']?.meta;
  if (extVrm1?.thumbnailImage != null && typeof extVrm1.thumbnailImage === 'number') {
    return extVrm1.thumbnailImage;
  }
  const extVrm0 = json.extensions?.VRM?.meta;
  if (extVrm0?.texture != null && typeof extVrm0.texture === 'number') {
    const texIndex = extVrm0.texture;
    const textures = json.textures;
    if (textures && textures[texIndex]?.source != null) return textures[texIndex].source;
  }
  return null;
}

/** 根据 image 索引从 GLB 中取出图片二进制 */
function extractImageFromGlb(
  json: any,
  bin: ArrayBuffer | null,
  imageIndex: number
): VrmThumbnailResult | null {
  const images = json.images;
  if (!images || imageIndex < 0 || imageIndex >= images.length) return null;
  const img = images[imageIndex];
  const mimeType = img.mimeType === 'image/jpeg' ? 'image/jpeg' : 'image/png';

  if (img.uri) {
    const dataUrl = img.uri;
    const base64 = dataUrl.split(',')[1];
    if (!base64) return null;
    const bytes =
      typeof Buffer !== 'undefined'
        ? new Uint8Array(Buffer.from(base64, 'base64'))
        : new Uint8Array(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
    if (bytes.length > MAX_THUMB_SIZE) return null;
    return { data: bytes.buffer, mimeType };
  }

  if (img.bufferView != null && bin) {
    const bufferViews = json.bufferViews;
    const buffers = json.buffers;
    if (!bufferViews || img.bufferView >= bufferViews.length) return null;
    const bv = bufferViews[img.bufferView];
    const byteOffset = bv.byteOffset || 0;
    const byteLength = bv.byteLength;
    if (byteOffset + byteLength > bin.byteLength) return null;
    if (byteLength > MAX_THUMB_SIZE) return null;
    const slice = bin.slice(byteOffset, byteOffset + byteLength);
    return { data: slice, mimeType };
  }

  return null;
}

/**
 * 从 VRM (GLB) 的 ArrayBuffer 中解析并返回缩略图。
 * 若无缩略图或解析失败则返回 null。
 */
export function extractVrmThumbnail(vrmBuffer: ArrayBuffer): VrmThumbnailResult | null {
  if (vrmBuffer.byteLength > MAX_VRM_SIZE) return null;
  try {
    const { json, bin } = parseGlbChunks(vrmBuffer);
    const imageIndex = getThumbnailImageIndex(json);
    if (imageIndex == null) return null;
    return extractImageFromGlb(json, bin, imageIndex);
  } catch {
    return null;
  }
}
