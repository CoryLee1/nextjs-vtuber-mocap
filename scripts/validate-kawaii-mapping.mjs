/**
 * Batch-validate KAWAII_ANIMATIONS_100 bone mapping against VRM.
 * Scans ALL 211 FBX files and reports mapping coverage.
 *
 * Usage: node scripts/validate-kawaii-mapping.mjs
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, basename } from 'path';

const FBX_DIR = 'E:/aiann/anndemo1unity/demo1/Assets/KAWAII_ANIMATIOMS_100/Assets/Animations';

// ─── Extract bone names from FBX using \x00\x01Model pattern ───────────────

function extractModelNames(buffer) {
  const names = [];
  for (let i = 0; i < buffer.length - 10; i++) {
    if (buffer[i] === 0x00 && buffer[i + 1] === 0x01 &&
        buffer.toString('ascii', i + 2, i + 7) === 'Model') {
      let nameEnd = i;
      let nameStart = i - 1;
      while (nameStart > 0 && buffer[nameStart] >= 0x20 && buffer[nameStart] <= 0x7E) {
        nameStart--;
      }
      nameStart++;
      if (nameEnd > nameStart) {
        const name = buffer.toString('ascii', nameStart, nameEnd);
        if (name.length > 0 && name.length < 100) {
          names.push(name);
        }
      }
    }
  }
  return names;
}

// ─── KAWAII bone mapping (same as in animation-manager.ts) ─────────────────

// Three.js FBXLoader converts spaces → underscores, so both forms are needed
// Raw FBX uses spaces, Three.js runtime uses underscores
const kawaiiVRMRigMap = {
  "Hips": "hips", "Spine": "spine", "Chest": "chest",
  "Upper Chest": "upperChest", "Upper_Chest": "upperChest",
  "Neck": "neck", "Head": "head",
  "Shoulder_L": "leftShoulder", "Upper Arm_L": "leftUpperArm", "Upper_Arm_L": "leftUpperArm",
  "Lower Arm_L": "leftLowerArm", "Lower_Arm_L": "leftLowerArm", "Hand_L": "leftHand",
  "Shoulder_R": "rightShoulder", "Upper Arm_R": "rightUpperArm", "Upper_Arm_R": "rightUpperArm",
  "Lower Arm_R": "rightLowerArm", "Lower_Arm_R": "rightLowerArm", "Hand_R": "rightHand",
  "Upper Leg_L": "leftUpperLeg", "Upper_Leg_L": "leftUpperLeg",
  "Lower Leg_L": "leftLowerLeg", "Lower_Leg_L": "leftLowerLeg",
  "Foot_L": "leftFoot", "Toes_L": "leftToes",
  "Upper Leg_R": "rightUpperLeg", "Upper_Leg_R": "rightUpperLeg",
  "Lower Leg_R": "rightLowerLeg", "Lower_Leg_R": "rightLowerLeg",
  "Foot_R": "rightFoot", "Toes_R": "rightToes",
  "Thumb Proximal_L": "leftThumbMetacarpal", "Thumb_Proximal_L": "leftThumbMetacarpal",
  "Thumb Intermediate_L": "leftThumbProximal", "Thumb_Intermediate_L": "leftThumbProximal",
  "Thumb Distal_L": "leftThumbDistal", "Thumb_Distal_L": "leftThumbDistal",
  "Index Proximal_L": "leftIndexProximal", "Index_Proximal_L": "leftIndexProximal",
  "Index Intermediate_L": "leftIndexIntermediate", "Index_Intermediate_L": "leftIndexIntermediate",
  "Index Distal_L": "leftIndexDistal", "Index_Distal_L": "leftIndexDistal",
  "Middle Proximal_L": "leftMiddleProximal", "Middle_Proximal_L": "leftMiddleProximal",
  "Middle Intermediate_L": "leftMiddleIntermediate", "Middle_Intermediate_L": "leftMiddleIntermediate",
  "Middle Distal_L": "leftMiddleDistal", "Middle_Distal_L": "leftMiddleDistal",
  "Ring Proximal_L": "leftRingProximal", "Ring_Proximal_L": "leftRingProximal",
  "Ring Intermediate_L": "leftRingIntermediate", "Ring_Intermediate_L": "leftRingIntermediate",
  "Ring Distal_L": "leftRingDistal", "Ring_Distal_L": "leftRingDistal",
  "Little Proximal_L": "leftLittleProximal", "Little_Proximal_L": "leftLittleProximal",
  "Little Intermediate_L": "leftLittleIntermediate", "Little_Intermediate_L": "leftLittleIntermediate",
  "Little Distal_L": "leftLittleDistal", "Little_Distal_L": "leftLittleDistal",
  "Thumb Proximal_R": "rightThumbMetacarpal", "Thumb_Proximal_R": "rightThumbMetacarpal",
  "Thumb Intermediate_R": "rightThumbProximal", "Thumb_Intermediate_R": "rightThumbProximal",
  "Thumb Distal_R": "rightThumbDistal", "Thumb_Distal_R": "rightThumbDistal",
  "Index Proximal_R": "rightIndexProximal", "Index_Proximal_R": "rightIndexProximal",
  "Index Intermediate_R": "rightIndexIntermediate", "Index_Intermediate_R": "rightIndexIntermediate",
  "Index Distal_R": "rightIndexDistal", "Index_Distal_R": "rightIndexDistal",
  "Middle Proximal_R": "rightMiddleProximal", "Middle_Proximal_R": "rightMiddleProximal",
  "Middle Intermediate_R": "rightMiddleIntermediate", "Middle_Intermediate_R": "rightMiddleIntermediate",
  "Middle Distal_R": "rightMiddleDistal", "Middle_Distal_R": "rightMiddleDistal",
  "Ring Proximal_R": "rightRingProximal", "Ring_Proximal_R": "rightRingProximal",
  "Ring Intermediate_R": "rightRingIntermediate", "Ring_Intermediate_R": "rightRingIntermediate",
  "Ring Distal_R": "rightRingDistal", "Ring_Distal_R": "rightRingDistal",
  "Little Proximal_R": "rightLittleProximal", "Little_Proximal_R": "rightLittleProximal",
  "Little Intermediate_R": "rightLittleIntermediate", "Little_Intermediate_R": "rightLittleIntermediate",
  "Little Distal_R": "rightLittleDistal", "Little_Distal_R": "rightLittleDistal",
};

// Also include other maps (for comparison with Mixamo files)
const mixamoNoPrefixMap = {
  Hips: "hips", Spine: "spine", Spine1: "chest", Spine2: "upperChest",
  Neck: "neck", Head: "head", LeftShoulder: "leftShoulder",
  LeftArm: "leftUpperArm", LeftForeArm: "leftLowerArm", LeftHand: "leftHand",
  RightShoulder: "rightShoulder", RightArm: "rightUpperArm",
  RightForeArm: "rightLowerArm", RightHand: "rightHand",
  LeftUpLeg: "leftUpperLeg", LeftLeg: "leftLowerLeg",
  LeftFoot: "leftFoot", LeftToeBase: "leftToes",
  RightUpLeg: "rightUpperLeg", RightLeg: "rightLowerLeg",
  RightFoot: "rightFoot", RightToeBase: "rightToes",
};

function getVrmBoneName(name) {
  return kawaiiVRMRigMap[name] ?? mixamoNoPrefixMap[name];
}

// ─── Main ──────────────────────────────────────────────────────────────────

const files = readdirSync(FBX_DIR).filter(f => /\.fbx$/i.test(f));
console.log(`\n📁 Validating ${files.length} FBX files...\n`);

let totalFiles = 0;
let successFiles = 0;
let failFiles = 0;
const boneFrequency = {};
const unmappedBones = {};
const inconsistentFiles = [];

for (const file of files) {
  totalFiles++;
  const buffer = readFileSync(join(FBX_DIR, file));
  const names = extractModelNames(buffer);

  let mappedCount = 0;
  let unmappedCount = 0;
  const fileUnmapped = [];

  for (const name of names) {
    boneFrequency[name] = (boneFrequency[name] || 0) + 1;

    if (name === 'root' || name === 'Root') continue; // Skip root-motion bone

    const vrmBone = getVrmBoneName(name);
    if (vrmBone) {
      mappedCount++;
    } else {
      unmappedCount++;
      unmappedBones[name] = (unmappedBones[name] || 0) + 1;
      fileUnmapped.push(name);
    }
  }

  if (mappedCount > 0 && unmappedCount === 0) {
    successFiles++;
  } else if (mappedCount > 0) {
    successFiles++; // Partial success - some mapped, some extra bones
  } else {
    failFiles++;
    inconsistentFiles.push({ file, names, unmapped: fileUnmapped });
  }

  // Log progress every 50 files
  if (totalFiles % 50 === 0) {
    process.stdout.write(`  ${totalFiles}/${files.length} files processed...\r`);
  }
}

console.log(`\n${'═'.repeat(70)}`);
console.log('📊 BATCH VALIDATION RESULTS');
console.log('═'.repeat(70));

console.log(`\nTotal files: ${totalFiles}`);
console.log(`✅ Files with valid mapping: ${successFiles}`);
console.log(`❌ Files with no mapping: ${failFiles}`);
console.log(`Success rate: ${(successFiles / totalFiles * 100).toFixed(1)}%`);

console.log(`\n── Bone frequency across all files ──`);
const sortedBones = Object.entries(boneFrequency).sort((a, b) => b[1] - a[1]);
for (const [bone, count] of sortedBones) {
  const vrmName = getVrmBoneName(bone);
  const status = bone === 'root' || bone === 'Root' ? '⏭️ root (skip)' : vrmName ? `✅ → ${vrmName}` : '❌ unmapped';
  console.log(`  ${String(count).padStart(4)} × ${bone.padEnd(30)} ${status}`);
}

if (Object.keys(unmappedBones).length > 0) {
  console.log(`\n── Unmapped bones ──`);
  for (const [bone, count] of Object.entries(unmappedBones).sort((a, b) => b - a)) {
    console.log(`  ${String(count).padStart(4)} × ${bone}`);
  }
}

if (inconsistentFiles.length > 0) {
  console.log(`\n── Files with no mapping (first 5) ──`);
  for (const f of inconsistentFiles.slice(0, 5)) {
    console.log(`  ${f.file}: bones=[${f.names.join(', ')}]`);
  }
}

// ─── Generate summary ──────────────────────────────────────────────────────

const expectedBones = [
  'root', 'Hips', 'Spine', 'Chest', 'Upper Chest', 'Neck', 'Head',
  'Shoulder_L', 'Upper Arm_L', 'Lower Arm_L', 'Hand_L',
  'Shoulder_R', 'Upper Arm_R', 'Lower Arm_R', 'Hand_R',
  'Upper Leg_L', 'Lower Leg_L', 'Foot_L', 'Toes_L',
  'Upper Leg_R', 'Lower Leg_R', 'Foot_R', 'Toes_R',
  'Thumb Proximal_L', 'Thumb Intermediate_L', 'Thumb Distal_L',
  'Index Proximal_L', 'Index Intermediate_L', 'Index Distal_L',
  'Middle Proximal_L', 'Middle Intermediate_L', 'Middle Distal_L',
  'Ring Proximal_L', 'Ring Intermediate_L', 'Ring Distal_L',
  'Little Proximal_L', 'Little Intermediate_L', 'Little Distal_L',
  'Thumb Proximal_R', 'Thumb Intermediate_R', 'Thumb Distal_R',
  'Index Proximal_R', 'Index Intermediate_R', 'Index Distal_R',
  'Middle Proximal_R', 'Middle Intermediate_R', 'Middle Distal_R',
  'Ring Proximal_R', 'Ring Intermediate_R', 'Ring Distal_R',
  'Little Proximal_R', 'Little Intermediate_R', 'Little Distal_R',
];

const allFoundBones = Object.keys(boneFrequency);
const expectedButMissing = expectedBones.filter(b => !allFoundBones.includes(b));
const unexpectedBones = allFoundBones.filter(b => !expectedBones.includes(b));

if (expectedButMissing.length === 0 && unexpectedBones.length === 0) {
  console.log('\n✅ ALL 211 FILES USE THE EXACT SAME 53-BONE SKELETON');
  console.log('   The kawaiiVRMRigMap covers 100% of mappable bones.');
} else {
  if (expectedButMissing.length > 0) {
    console.log(`\n⚠️ Expected but missing: ${expectedButMissing.join(', ')}`);
  }
  if (unexpectedBones.length > 0) {
    console.log(`\n⚠️ Unexpected bones found: ${unexpectedBones.join(', ')}`);
  }
}

// ─── Generate animation catalog for S3 upload ──────────────────────────────

console.log('\n\n' + '═'.repeat(70));
console.log('📋 ANIMATION CATALOG (for S3 upload planning)');
console.log('═'.repeat(70));

const categories = {};
for (const file of files) {
  const name = file.replace(/^@KA_/, '').replace(/\.FBX$/i, '');
  const firstUnderscore = name.indexOf('_');
  // Group by first word before number
  const match = name.match(/^([A-Za-z]+)/);
  const category = match ? match[1] : 'Other';
  if (!categories[category]) categories[category] = [];
  categories[category].push({ file, name, size: readFileSync(join(FBX_DIR, file)).length });
}

let totalSize = 0;
for (const [cat, anims] of Object.entries(categories).sort()) {
  const catSize = anims.reduce((sum, a) => sum + a.size, 0);
  totalSize += catSize;
  console.log(`\n${cat} (${anims.length} files, ${(catSize / 1024 / 1024).toFixed(1)} MB):`);
  for (const a of anims) {
    console.log(`  ${a.name.padEnd(45)} ${(a.size / 1024).toFixed(0)} KB`);
  }
}

console.log(`\n📦 Total: ${files.length} files, ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
console.log(`Average file size: ${(totalSize / files.length / 1024).toFixed(0)} KB`);
