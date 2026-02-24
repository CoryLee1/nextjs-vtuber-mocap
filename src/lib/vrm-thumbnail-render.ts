/**
 * 客户端：当 VRM 无内嵌缩略图时，用 Three.js 渲染一帧「证件照」并导出为 PNG。
 * 仅用于浏览器，动态 import Three 与 VRM loader。
 */

const THUMB_SIZE = 512;

export type GenerateVrmThumbnailBlobResult = { blob: Blob } | null;
export interface GenerateVrmThumbnailOptions {
  /** 为 true 时跳过 VRM 内嵌 thumbnail 提取，强制走 Three.js 正面渲染 */
  skipExtraction?: boolean;
}

/**
 * 先尝试从 VRM 内嵌 meta.thumbnailImage 取出缩略图；若无则渲染一帧并返回 PNG Blob。
 */
export async function generateVrmThumbnailBlob(
  file: File,
  options?: GenerateVrmThumbnailOptions
): Promise<GenerateVrmThumbnailBlobResult | null> {
  if (typeof window === 'undefined') return null;
  const skipExtraction = options?.skipExtraction ?? false;
  if (!skipExtraction) {
    const buf = await file.arrayBuffer();
    const extracted = await tryExtractFromVrm(buf);
    if (extracted) return { blob: extracted };
  }
  return await renderVrmToBlob(file);
}

async function tryExtractFromVrm(buffer: ArrayBuffer): Promise<Blob | null> {
  try {
    const { extractVrmThumbnail } = await import('@/lib/vrm-thumbnail');
    const result = extractVrmThumbnail(buffer);
    if (!result) return null;
    return new Blob([result.data], { type: result.mimeType });
  } catch {
    return null;
  }
}

async function renderVrmToBlob(file: File): Promise<GenerateVrmThumbnailBlobResult | null> {
  const url = URL.createObjectURL(file);
  try {
    const THREE = await import('three');
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader');
    const { VRMLoaderPlugin, VRMUtils } = await import('@pixiv/three-vrm');

    const canvas = document.createElement('canvas');
    canvas.width = THUMB_SIZE;
    canvas.height = THUMB_SIZE;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false, // 不透明，避免导出时透明区域显示为黑
      preserveDrawingBuffer: true,
    });
    renderer.setSize(THUMB_SIZE, THUMB_SIZE);
    renderer.setClearColor(new THREE.Color(0xf0f0f0), 1); // 灰白背景
    renderer.setPixelRatio(1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);

    // 三点布光：主光（右前上）+ 补光（左后）+ 顶光，避免阴影过重
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(1.5, 2, 2);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-2, 1, -1);
    scene.add(fillLight);

    const loader = new GLTFLoader();
    loader.register((parser: any) => new VRMLoaderPlugin(parser));

    const gltf = await new Promise<any>((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });

    const vrm = gltf?.userData?.vrm;
    if (!vrm?.scene) {
      return null;
    }

    // VRM 0.x 默认朝向 -Z，rotateVRM0 将其旋转 180° 使其与 VRM 1.x 一致朝向 +Z
    // 注意：不能用头骨的 worldQuaternion 判断朝向——rotateVRM0 会让其 world quaternion
    // 包含 180° 偏航，applyQuaternion 后反而得到 -Z，相机拍到背面。
    // 修复：始终在 rotateVRM0 之后将相机放置在 +Z 侧（面向正面）。
    if (vrm.meta?.metaVersion === '0') {
      VRMUtils.rotateVRM0(vrm);
    }

    scene.add(vrm.scene);

    // 更新世界矩阵，确保 getWorldPosition 返回正确值
    vrm.scene.updateWorldMatrix(true, true);

    const box = new THREE.Box3().setFromObject(vrm.scene);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    // 使用头骨世界坐标精确定位，避免包围盒估算误差（头顶被截/颈部被截）
    let headWorldY = center.y + size.y * 0.38; // fallback
    try {
      const headNode = vrm.humanoid?.getNormalizedBoneNode?.('head');
      if (headNode) {
        const headPos = new THREE.Vector3();
        headNode.getWorldPosition(headPos);
        headWorldY = headPos.y;
      }
    } catch {
      // getWorldPosition 失败时沿用 fallback
    }

    // rotateVRM0 后全部 VRM 朝向 +Z，相机固定放在 +Z 侧拍正脸
    const dist = Math.max(0.55, size.y * 0.42);
    camera.position.set(center.x, headWorldY + 0.05, center.z + dist);
    camera.lookAt(center.x, headWorldY - 0.03, center.z);
    camera.updateProjectionMatrix();

    renderer.clear();
    renderer.render(scene, camera);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b || null), 'image/png', 0.92);
    });

    renderer.dispose();
    if (vrm.dispose) vrm.dispose();
    return blob ? { blob } : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
