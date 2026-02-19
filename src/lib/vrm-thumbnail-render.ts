/**
 * 客户端：当 VRM 无内嵌缩略图时，用 Three.js 渲染一帧「证件照」并导出为 PNG。
 * 仅用于浏览器，动态 import Three 与 VRM loader。
 */

const THUMB_SIZE = 512;

export type GenerateVrmThumbnailBlobResult = { blob: Blob } | null;

/**
 * 先尝试从 VRM 内嵌 meta.thumbnailImage 取出缩略图；若无则渲染一帧并返回 PNG Blob。
 */
export async function generateVrmThumbnailBlob(file: File): Promise<GenerateVrmThumbnailBlobResult | null> {
  if (typeof window === 'undefined') return null;
  const buf = await file.arrayBuffer();
  const extracted = await tryExtractFromVrm(buf);
  if (extracted) return { blob: extracted };
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
    const { VRMLoaderPlugin } = await import('@pixiv/three-vrm');

    const canvas = document.createElement('canvas');
    canvas.width = THUMB_SIZE;
    canvas.height = THUMB_SIZE;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(THUMB_SIZE, THUMB_SIZE);
    renderer.setClearColor(new THREE.Color(0x1a1a2e), 1);
    renderer.setPixelRatio(1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
    camera.position.set(0, 1.1, 1.8);
    camera.lookAt(0, 1, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(2, 3, 2);
    scene.add(dir);

    const loader = new GLTFLoader();
    loader.register((parser: any) => new VRMLoaderPlugin(parser));

    const gltf = await new Promise<any>((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });

    const vrm = gltf?.userData?.vrm;
    if (!vrm?.scene) {
      return null;
    }

    scene.add(vrm.scene);
    const box = new THREE.Box3().setFromObject(vrm.scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = Math.max(1.5, maxDim * 1.8);
    camera.position.set(center.x, center.y + 0.1, center.z + dist);
    camera.lookAt(center.x, center.y, center.z);
    camera.updateProjectionMatrix();

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
