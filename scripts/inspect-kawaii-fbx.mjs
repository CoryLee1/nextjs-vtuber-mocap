/**
 * 独立脚本：解析 KAWAII FBX 并打印骨骼名，用于制作 KAWAII_VRM_RIG_MAP。
 * 运行: node scripts/inspect-kawaii-fbx.mjs
 * 或:   node scripts/inspect-kawaii-fbx.mjs public/models/animations/kawaii-test/@KA_Idle51_StandingTalk1_2.FBX
 */
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const defaultPath = path.join(root, 'public/models/animations/kawaii-test/@KA_Idle51_StandingTalk1_2.FBX');

const fbxPath = process.argv[2] || defaultPath;

async function main() {
  const buf = await readFile(fbxPath);
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

  const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
  const loader = new FBXLoader();
  const group = loader.parse(arrayBuffer, path.dirname(fbxPath));

  const clips = group?.animations ?? [];
  if (!clips.length) {
    console.log('No animations in FBX');
    return;
  }
  const clip = clips[0];
  const boneNames = [...new Set(clip.tracks.map((t) => t.name.replace(/\.[^.]+$/, '')))].sort();
  const nodeNames = [];
  function collect(n) {
    if (n.name) nodeNames.push(n.name);
    if (n.children) n.children.forEach(collect);
  }
  group.traverse(collect);

  console.log('File:', fbxPath);
  console.log('Clip name:', clip.name);
  console.log('Track count:', clip.tracks.length);
  console.log('\nBone names (from track names, unique):');
  boneNames.forEach((b) => console.log(' ', b));
  console.log('\nScene node names (first 80):');
  nodeNames.slice(0, 80).forEach((n) => console.log(' ', n));
  if (nodeNames.length > 80) console.log(' ... and', nodeNames.length - 80, 'more');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
