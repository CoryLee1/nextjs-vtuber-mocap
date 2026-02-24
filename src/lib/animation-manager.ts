import { useFBX } from '@react-three/drei';
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { AnimationMixer, LoopRepeat, AnimationUtils } from 'three';
import * as THREE from 'three';
import { MIXAMO_VRM_RIG_MAP, KAWAII_VRM_RIG_MAP, KAWAII_QUAT_SIGN_FLIPS, KAWAII_YUP_QUAT_SIGN_FLIPS, KAWAII_YUP_LOWERLEG_BONES } from '@/lib/constants';
import { detectFbxSceneZUp, convertPositionZUpToYUp, convertQuaternionTrackZUpToYUp, convertQuaternionZUpToYUp } from '@/lib/coordinate-axes';
import { DEFAULT_IDLE_URL } from '@/config/vtuber-animations';

const KAWAII_LOWERLEG_BONES = new Set(KAWAII_YUP_LOWERLEG_BONES);

// ─── Universal Auto-Mapper: FBX bone name → VRM humanoid bone name ────────
//
// Instead of hardcoding maps for every rig format, we normalize any bone name
// into a canonical key and match against VRM humanoid bone vocabulary.
// Works for Mixamo, UE4 Mannequin, KAWAII Unity Humanoid, and unknown rigs.
// ───────────────────────────────────────────────────────────────────────────

/** All VRM humanoid bone names the auto-mapper can target */
const VRM_BONE_NAMES = [
  'hips','spine','chest','upperChest','neck','head',
  'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
  'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
  'leftUpperLeg','leftLowerLeg','leftFoot','leftToes',
  'rightUpperLeg','rightLowerLeg','rightFoot','rightToes',
  'leftThumbMetacarpal','leftThumbProximal','leftThumbDistal',
  'leftIndexProximal','leftIndexIntermediate','leftIndexDistal',
  'leftMiddleProximal','leftMiddleIntermediate','leftMiddleDistal',
  'leftRingProximal','leftRingIntermediate','leftRingDistal',
  'leftLittleProximal','leftLittleIntermediate','leftLittleDistal',
  'rightThumbMetacarpal','rightThumbProximal','rightThumbDistal',
  'rightIndexProximal','rightIndexIntermediate','rightIndexDistal',
  'rightMiddleProximal','rightMiddleIntermediate','rightMiddleDistal',
  'rightRingProximal','rightRingIntermediate','rightRingDistal',
  'rightLittleProximal','rightLittleIntermediate','rightLittleDistal',
] as const;

/**
 * Synonym table: maps every known token variant → canonical VRM token.
 * Used by the normalizer to collapse e.g. "forearm"→"lowerarm", "calf"→"lowerleg".
 */
const SYNONYMS: Record<string, string> = {
  // torso
  hips: 'hips', hip: 'hips', pelvis: 'hips',
  spine: 'spine',
  chest: 'chest',
  upperchest: 'upperchest',
  neck: 'neck',
  head: 'head',
  // arms
  shoulder: 'shoulder', clavicle: 'shoulder',
  upperarm: 'upperarm', arm: 'upperarm',
  lowerarm: 'lowerarm', forearm: 'lowerarm',
  hand: 'hand',
  // legs
  upperleg: 'upperleg', upleg: 'upperleg', thigh: 'upperleg',
  lowerleg: 'lowerleg', leg: 'lowerleg', calf: 'lowerleg', shin: 'lowerleg',
  foot: 'foot',
  toes: 'toes', toe: 'toes', toebase: 'toes', ball: 'toes',
  // fingers
  thumb: 'thumb',
  index: 'index',
  middle: 'middle',
  ring: 'ring',
  little: 'little', pinky: 'little',
  // finger segments
  metacarpal: 'metacarpal',
  proximal: 'proximal', '1': 'proximal', '01': 'proximal',
  intermediate: 'intermediate', '2': 'intermediate', '02': 'intermediate',
  distal: 'distal', '3': 'distal', '03': 'distal',
};

/** Side token normalization */
const SIDE_MAP: Record<string, 'left' | 'right'> = {
  l: 'left', left: 'left', _l: 'left',
  r: 'right', right: 'right', _r: 'right',
};

/** Prefixes to strip */
const STRIP_PREFIXES = ['mixamorig1', 'mixamorig', 'armature|'];

/** Cache for auto-mapped results (rig bone name → vrm bone name) */
const _autoMapCache = new Map<string, string | null>();

/**
 * Universal auto-mapper: given any FBX bone name, returns the matching VRM
 * humanoid bone name or null. No hardcoded rig-specific tables needed.
 *
 * Algorithm:
 *  1. Strip known prefixes (mixamorig, Armature|)
 *  2. Tokenize by separators (_, space, camelCase boundaries)
 *  3. Detect side (L/R, Left/Right, _l/_r)
 *  4. Map tokens through synonym table
 *  5. Assemble canonical VRM bone name and validate
 */
function autoMapBoneToVrm(rawName: string): string | null {
  if (_autoMapCache.has(rawName)) return _autoMapCache.get(rawName)!;

  let name = rawName;

  // 1. Strip prefixes
  for (const prefix of STRIP_PREFIXES) {
    if (name.toLowerCase().startsWith(prefix)) {
      name = name.slice(prefix.length);
    }
  }
  // Handle "Armature|BoneName" pipe separator
  if (name.includes('|')) name = name.split('|').pop()!;

  // Skip root/reference bones
  const lower = name.toLowerCase();
  if (lower === 'root' || lower === 'reference' || lower === 'armature') {
    _autoMapCache.set(rawName, null);
    return null;
  }

  // 2. Tokenize: split on _, space, and camelCase boundaries
  //    "Upper_Arm_L" → ["Upper","Arm","L"]
  //    "mixamorigLeftForeArm" → ["Left","Fore","Arm"]  (after prefix strip)
  //    "spine_03" → ["spine","03"]
  const tokens = name
    .replace(/([a-z])([A-Z])/g, '$1_$2')  // camelCase → snake
    .split(/[_\s]+/)
    .map(t => t.toLowerCase())
    .filter(t => t.length > 0);

  // 3. Detect side
  let side: 'left' | 'right' | '' = '';
  const sideTokenIndices: number[] = [];
  tokens.forEach((t, i) => {
    const s = SIDE_MAP[t];
    if (s) { side = s; sideTokenIndices.push(i); }
  });
  // Remove side tokens for body-part matching
  const bodyTokens = tokens.filter((_, i) => !sideTokenIndices.includes(i));

  // 4. Map tokens through synonyms — try compound pairs first
  //    "Upper_Arm" → tokens ["upper","arm"] → compound "upperarm" → SYNONYMS → "upperarm"
  //    Without this, "arm" alone maps to "upperarm" which breaks "Lower_Arm"
  const mapped: string[] = [];
  for (let ci = 0; ci < bodyTokens.length; ci++) {
    if (ci + 1 < bodyTokens.length) {
      const compound = bodyTokens[ci] + bodyTokens[ci + 1];
      if (SYNONYMS[compound]) { mapped.push(SYNONYMS[compound]); ci++; continue; }
    }
    mapped.push(SYNONYMS[bodyTokens[ci]] || bodyTokens[ci]);
  }

  // 5. Determine VRM bone name by pattern matching
  let vrmBone: string | null = null;

  // --- Finger detection: has a finger name + segment ---
  const fingerNames = ['thumb', 'index', 'middle', 'ring', 'little'];
  const segmentNames = ['metacarpal', 'proximal', 'intermediate', 'distal'];
  const finger = mapped.find(t => fingerNames.includes(t));
  const segment = mapped.find(t => segmentNames.includes(t));

  if (finger && segment && side) {
    // Thumb uses metacarpal for first joint; others use proximal
    if (finger === 'thumb' && segment === 'proximal') {
      // Many rigs call thumb's first joint "Proximal" but VRM calls it "Metacarpal"
      // Check if there are 3 thumb bones: if this is the first, it's metacarpal
      // Heuristic: if the original name has "1" or "Proximal" for thumb → metacarpal
      vrmBone = `${side}ThumbMetacarpal`;
    } else if (finger === 'thumb' && segment === 'intermediate') {
      vrmBone = `${side}ThumbProximal`;
    } else if (finger === 'thumb' && segment === 'distal') {
      vrmBone = `${side}ThumbDistal`;
    } else {
      const capFinger = finger.charAt(0).toUpperCase() + finger.slice(1);
      const capSegment = segment.charAt(0).toUpperCase() + segment.slice(1);
      vrmBone = `${side}${capFinger}${capSegment}`;
    }
  }
  // --- Limb detection ---
  else if (mapped.includes('shoulder') && side) {
    vrmBone = `${side}Shoulder`;
  } else if (mapped.includes('upperarm') && side) {
    vrmBone = `${side}UpperArm`;
  } else if (mapped.includes('lowerarm') && side) {
    vrmBone = `${side}LowerArm`;
  } else if (mapped.includes('hand') && side) {
    vrmBone = `${side}Hand`;
  } else if (mapped.includes('upperleg') && side) {
    vrmBone = `${side}UpperLeg`;
  } else if (mapped.includes('lowerleg') && side) {
    vrmBone = `${side}LowerLeg`;
  } else if (mapped.includes('foot') && side) {
    vrmBone = `${side}Foot`;
  } else if (mapped.includes('toes') && side) {
    vrmBone = `${side}Toes`;
  }
  // --- Torso (no side) ---
  else if (mapped.includes('hips')) {
    vrmBone = 'hips';
  } else if (mapped.includes('upperchest')) {
    vrmBone = 'upperChest';
  } else if (mapped.includes('chest')) {
    vrmBone = 'chest';
  } else if (mapped.includes('spine')) {
    // Handle numbered spines: spine, spine1/spine_01 → chest, spine2/spine_02 → upperChest
    const numToken = bodyTokens.find(t => /^\d+$/.test(t));
    if (numToken) {
      const num = parseInt(numToken, 10);
      if (num <= 1) vrmBone = 'spine';       // spine_01
      else if (num === 2) vrmBone = 'spine';  // spine_02 (Mixamo: spine → spine)
      else if (num === 3) vrmBone = 'chest';  // spine_03
      else vrmBone = 'upperChest';            // spine_04+
    } else {
      vrmBone = 'spine';
    }
    // Special: "Spine1" / "Spine2" (Mixamo no-prefix) — already tokenized as ["spine","1"]
    const idx = bodyTokens.indexOf('spine');
    const next = bodyTokens[idx + 1];
    if (next === '1') vrmBone = 'chest';
    if (next === '2') vrmBone = 'upperChest';
  } else if (mapped.includes('neck')) {
    vrmBone = 'neck';
  } else if (mapped.includes('head')) {
    vrmBone = 'head';
  }

  // Validate against actual VRM bone list
  if (vrmBone && !(VRM_BONE_NAMES as readonly string[]).includes(vrmBone)) {
    vrmBone = null;
  }

  _autoMapCache.set(rawName, vrmBone);
  return vrmBone;
}

/**
 * Universal FBX → VRM animation retargeting.
 *
 * 与 remapMixamoAnimationToVrm + mixamoVRMRigMap 参考实现对齐：
 *  1. 优先 clip 名 "mixamo.com"，骨骼表用 MIXAMO_VRM_RIG_MAP（含手指）
 *  2. 旋转：世界四元数 rest-pose 补偿；VRM 0.x 时四元数 x/z 取反
 *  3. 臀部位移：motionHipsHeight = Mixamo hips.position.y，缩放 vrmHipsHeight/motionHipsHeight；VRM 0.x 时 position x/z 取反
 *  4. 跳过 .scale，避免比例错乱
 */
export function remapAnimationToVrm(vrm, fbxScene) {
    if (!vrm?.humanoid || !fbxScene?.animations?.length) {
        console.warn('AnimationManager: missing vrm.humanoid or fbxScene.animations');
        return null;
    }

    // 与参考实现一致：优先使用 Mixamo 导出的 clip 名 "mixamo.com"，否则用第一个
    const srcClip = THREE.AnimationClip.findByName(fbxScene.animations, 'mixamo.com')
        ?? fbxScene.animations[0];
    if (!srcClip) return null;

    const clip = srcClip.clone();
    const tracks: THREE.KeyframeTrack[] = [];
    const _quatA = new THREE.Quaternion();
    const _vec3 = new THREE.Vector3();
    const restRotationInverse = new THREE.Quaternion();
    const parentRestWorldRotation = new THREE.Quaternion();

    // Rig 检测：存在 KAWAII 表内骨骼名且无 mixamorig 则视为 KAWAII
    const hasMixamo = clip.tracks.some((t) => t.name.includes('mixamorig'));
    const hasKawaiiBone = clip.tracks.some((t) => {
      const b = t.name.split('.')[0];
      const bone = b.includes('|') ? b.split('|').pop()! : b;
      return !!KAWAII_VRM_RIG_MAP[bone];
    });
    const isKawaii = !hasMixamo && hasKawaiiBone;
    const boneMap: Record<string, string> = isKawaii ? KAWAII_VRM_RIG_MAP : (MIXAMO_VRM_RIG_MAP as Record<string, string>);
    const isZUp = detectFbxSceneZUp(fbxScene);

    // Ensure world matrices are up-to-date before reading rest pose
    fbxScene.updateWorldMatrix(true, true);
    vrm.scene.updateWorldMatrix(true, true);

    // Hips 节点与 motion 高度：Mixamo 用 local position.y，KAWAII(Z-up) 用 position.z
    const srcHipsNode = isKawaii
        ? (fbxScene.getObjectByName('Hips') ?? fbxScene.getObjectByName('pelvis'))
        : (fbxScene.getObjectByName('mixamorigHips') ?? fbxScene.getObjectByName('mixamorig1Hips') ?? fbxScene.getObjectByName('Hips') ?? fbxScene.getObjectByName('pelvis'));
    const motionHipsHeight = isKawaii && isZUp && srcHipsNode
        ? Math.abs(srcHipsNode.position.z) || srcHipsNode.getWorldPosition(_vec3).y
        : (srcHipsNode?.position?.y ?? (srcHipsNode ? srcHipsNode.getWorldPosition(_vec3).y : 1));
    const vrmHipsNode = vrm.humanoid.getNormalizedBoneNode('hips');
    let vrmHipsHeight = 1;
    if (vrmHipsNode) {
        const vrmHipsY = vrmHipsNode.getWorldPosition(_vec3).y;
        const vrmRootY = vrm.scene.getWorldPosition(_vec3).y;
        vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY) || 1;
    }
    const hipsPositionScale = motionHipsHeight > 0 ? vrmHipsHeight / motionHipsHeight : 1;

    const isVrm0 = vrm.meta?.metaVersion === '0';
    let mapped = 0;
    /** KAWAII 诊断：rest、原始第一帧、管线输出第一帧，便于分析扭曲并自动导出 JSON */
    const kawaiiDiagnostic: { vrmBoneName: string; restLocal: [number, number, number, number]; firstFrame: [number, number, number, number]; firstFrameOut: [number, number, number, number] }[] = [];

    for (const track of clip.tracks) {
        // Parse track name: "BoneName.quaternion", "Armature|BoneName.position"
        const dotIdx = track.name.lastIndexOf('.');
        if (dotIdx < 0) continue;
        const propName = track.name.slice(dotIdx + 1);  // quaternion | position | scale
        let rawBone = track.name.slice(0, dotIdx);
        if (rawBone.includes('|')) rawBone = rawBone.split('|').pop()!;

        // Skip scale tracks — they store bone-length ratios of the source rig,
        // applying them to VRM would distort the model's proportions
        if (propName === 'scale') continue;

        // 骨骼映射：KAWAII 用 KAWAII_VRM_RIG_MAP，Mixamo 用 MIXAMO_VRM_RIG_MAP + mixamorig1 归一化，否则 auto-mapper
        const rawBoneForMap = rawBone.replace(/^mixamorig1/, 'mixamorig');
        const vrmBoneName = boneMap[rawBone] ?? boneMap[rawBoneForMap] ?? (!isKawaii ? autoMapBoneToVrm(rawBone) : null);
        if (!vrmBoneName) continue;

        // Resolve VRM node
        const vrmNode = vrm.humanoid.getNormalizedBoneNode(vrmBoneName);
        if (!vrmNode) continue;

        // Find source bone in FBX: KAWAII 用精确名，Mixamo 用多种前缀尝试
        const srcNode = isKawaii
            ? fbxScene.getObjectByName(rawBone)
            : (fbxScene.getObjectByName(rawBone) ||
               fbxScene.getObjectByName(rawBone.replace(/^mixamorig1?/, '')) ||
               fbxScene.getObjectByName(rawBone.startsWith('mixamorig') ? rawBone : 'mixamorig' + (rawBone.charAt(0).toUpperCase() + rawBone.slice(1))) ||
               fbxScene.getObjectByName(rawBone.startsWith('mixamorig1') ? rawBone : 'mixamorig1' + (rawBone.charAt(0).toUpperCase() + rawBone.slice(1))));
        if (!srcNode) continue;

        if (propName === 'quaternion' && track instanceof THREE.QuaternionKeyframeTrack) {
            // KAWAII(Z-up)：仅在场景为 Z-up 时在 Z-up 空间做 rest 补偿再转 Y-up；否则与 rest 同空间处理避免全身扭曲
            // Mixamo(Y-up)：世界四元数 rest，track 不需轴转换
            const useKawaiiZUpPipeline = isKawaii && isZUp;
            const rawValues = useKawaiiZUpPipeline
                ? track.values
                : (isZUp ? convertQuaternionTrackZUpToYUp(new Float32Array(track.values)) : track.values);

            if (useKawaiiZUpPipeline) {
                restRotationInverse.copy(srcNode.quaternion).invert();
                parentRestWorldRotation.identity();
            } else if (isKawaii) {
                // Y-up: 用世界空间（和 Mixamo 一样）
                srcNode.getWorldQuaternion(restRotationInverse).invert();
                if (srcNode.parent) {
                    srcNode.parent.getWorldQuaternion(parentRestWorldRotation);
                } else {
                    parentRestWorldRotation.identity();
                }
                // KAWAII Hips 嵌入了 Z-up→Y-up 的旋转，需在 worldRest 里消除；Hips 单独用 local restInv × track
                if (isKawaii && !isZUp && vrmBoneName === 'hips') {
                    restRotationInverse.copy(srcNode.quaternion).invert();
                    parentRestWorldRotation.identity();
                }
            } else {
                srcNode.getWorldQuaternion(restRotationInverse).invert();
                if (srcNode.parent) {
                    srcNode.parent.getWorldQuaternion(parentRestWorldRotation);
                } else {
                    parentRestWorldRotation.identity();
                }
            }

            const values = new Float32Array(rawValues.length);
            for (let i = 0; i < rawValues.length; i += 4) {
                _quatA.set(rawValues[i], rawValues[i+1], rawValues[i+2], rawValues[i+3]);
                _quatA.premultiply(parentRestWorldRotation).multiply(restRotationInverse);  // output = parentWorldRest × worldTrack × worldRestInv
                if (useKawaiiZUpPipeline) convertQuaternionZUpToYUp(_quatA);
                // KAWAII Y-up LowerLeg：FBX 膝盖为 Z 轴旋转，VRM 期望 Y 轴；R*q*R^-1 (+X90°) 转换
                if (isKawaii && !isZUp && KAWAII_LOWERLEG_BONES.has(vrmBoneName)) {
                    const s = Math.SQRT1_2;
                    const R = new THREE.Quaternion(s, 0, 0, s);
                    _quatA.premultiply(R).multiply(R.clone().invert());
                }
                values[i]   = _quatA.x;
                values[i+1] = _quatA.y;
                values[i+2] = _quatA.z;
                values[i+3] = _quatA.w;
            }
            // KAWAII per-bone 符号修正：Z-up 用 KAWAII_QUAT_SIGN_FLIPS；Y-up（如 Unreal Take）用 Blender 对比得出的 KAWAII_YUP_QUAT_SIGN_FLIPS
            const signFlip = useKawaiiZUpPipeline
                ? KAWAII_QUAT_SIGN_FLIPS[vrmBoneName]
                : (isKawaii && !isZUp ? KAWAII_YUP_QUAT_SIGN_FLIPS[vrmBoneName] : undefined);
            if (signFlip) {
                for (let i = 0; i < values.length; i += 4) {
                    values[i] *= signFlip[0];
                    values[i+1] *= signFlip[1];
                    values[i+2] *= signFlip[2];
                    values[i+3] *= signFlip[3];
                }
            }
            // 半球规范化：确保 w >= 0，避免四元数对踵导致插值走 360° 长弧
            // 对 isKawaii && !isZUp 路径全局生效（Unreal Take FBX 有此问题）
            if (isKawaii && !isZUp) {
                for (let i = 0; i < values.length; i += 4) {
                    if (values[i + 3] < 0) {
                        values[i]     = -values[i];
                        values[i + 1] = -values[i + 1];
                        values[i + 2] = -values[i + 2];
                        values[i + 3] = -values[i + 3];
                    }
                }
            }
            // KAWAII 诊断：收集 rest、原始第一帧、管线输出第一帧（便于分析扭曲来源）
            if (isKawaii && rawValues.length >= 4) {
                const rest = srcNode.quaternion;
                kawaiiDiagnostic.push({
                    vrmBoneName,
                    restLocal: [rest.x, rest.y, rest.z, rest.w],
                    firstFrame: [rawValues[0], rawValues[1], rawValues[2], rawValues[3]],
                    firstFrameOut: [values[0], values[1], values[2], values[3]],
                });
            }
            // VRM 0.x：四元数 x/z 分量取反（与参考一致）
            const outValues = isVrm0
                ? Array.from(values).map((v, i) => (i % 2 === 0 ? -v : v))
                : Array.from(values);

            tracks.push(new THREE.QuaternionKeyframeTrack(
                `${vrmNode.name}.quaternion`, track.times, outValues
            ));
            mapped++;
        }
        else if (propName === 'position' && vrmBoneName === 'hips' && track instanceof THREE.VectorKeyframeTrack) {
            // KAWAII：不输出 hips position，保持角色在原点，避免切回其他动画时 origin 被带走
            if (isKawaii) continue;
            // 臀部位移：Z-up 时先转 Y-up，再按高度缩放 + VRM 0.x 取反
            let value = Array.from(track.values);
            if (isZUp) {
                const arr = new Float32Array(value.length);
                arr.set(value);
                convertPositionZUpToYUp(arr, 3, true);
                value = Array.from(arr);
            }
            const scaled = value.map((v, i) =>
                (isVrm0 && i % 3 !== 1 ? -v : v) * hipsPositionScale
            );
            tracks.push(new THREE.VectorKeyframeTrack(
                `${vrmNode.name}.position`, track.times, scaled
            ));
            mapped++;
        }
        // All other tracks (non-hips position, scale) are intentionally skipped
    }

    if (isKawaii && kawaiiDiagnostic.length > 0 && typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.groupCollapsed('[AnimationManager] KAWAII 诊断：rest / firstFrame(原始) / firstFrameOut(管线输出)');
        console.log(JSON.stringify(kawaiiDiagnostic, null, 2));
        console.groupEnd();
        // 自动导出调试用 JSON，便于分析扭曲原因（rest vs 原始第一帧 vs 管线输出）
        try {
            const safeName = (clip.name || 'clip').replace(/[^\w\-.]/g, '_').slice(0, 60);
            const payload = {
                meta: { clipName: clip.name, duration: clip.duration, isZUp, isVrm0, exportedAt: new Date().toISOString() },
                diagnostic: kawaiiDiagnostic,
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kawaii-retarget-diagnostic-${safeName}-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.warn('[AnimationManager] KAWAII 诊断 JSON 导出失败', e);
        }
    }

    if (tracks.length === 0) {
        const allNames = clip.tracks.map(t => t.name);
        console.warn('AnimationManager: 0 tracks mapped，请检查 FBX 骨骼名是否与 Mixamo/VRM 一致。Track 列表:', allNames);
        return null;
    }

    const outClip = new THREE.AnimationClip("vrmAnimation", clip.duration, tracks);
    if (process.env.NODE_ENV === 'development') {
        const rawList = clip.tracks.map(t => ({ name: t.name, type: t.type || (t as any).constructor?.name }));
        const mappedList = tracks.map((t: THREE.KeyframeTrack) => {
            const name = t.name;
            const isQuat = t instanceof THREE.QuaternionKeyframeTrack;
            const first = isQuat && t.values.length >= 4
                ? { x: t.values[0], y: t.values[1], z: t.values[2], w: t.values[3] }
                : !isQuat && t.values.length >= 3
                    ? { x: t.values[0], y: t.values[1], z: t.values[2] }
                    : null;
            return { trackName: name, keyframes: t.times.length, firstValue: first };
        });
        console.groupCollapsed('[AnimationManager] 动画重定向调试');
        console.log('原始 FBX tracks:', rawList);
        console.log('重定向后 VRM tracks:', mappedList);
        console.log('统计:', { rawCount: clip.tracks.length, mappedCount: mapped, duration: clip.duration.toFixed(2) + 's' });
        console.groupEnd();
    }
    console.log(`AnimationManager: retarget OK — ${mapped} tracks from ${clip.tracks.length} (${clip.duration.toFixed(1)}s)`);
    return outClip;
}

// ✅ 获取 VRM 的唯一标识符（更可靠的检测方式）
const getVrmId = (vrm: any): string => {
    if (!vrm) return '';
    // 优先使用 scene 的 uuid（最可靠）
    if (vrm.scene?.uuid) {
        return `vrm-${vrm.scene.uuid}`;
    }
    // 备用：使用 humanoid 的某些属性
    if (vrm.humanoid) {
        return `vrm-humanoid-${vrm.humanoid.humanBones ? 'has-bones' : 'no-bones'}`;
    }
    // 最后备用：使用对象引用（不太可靠，但在某些情况下有用）
    return `vrm-ref-${String(vrm).slice(0, 20)}`;
};

// 改进的动画管理器：默认 URL 与 vtuber-animations 保持一致，且规范化错误路径（缺少 /animations/）
const S3_ANIM_BASE = 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com';
const DEFAULT_ANIMATION_URL = DEFAULT_IDLE_URL;

/** 若 URL 是 S3 base 直接加文件名（缺少 /animations/），修正为正确路径，避免 403/404 */
function normalizeAnimationUrl(url: string): string {
  if (typeof url !== 'string' || !url.trim()) return DEFAULT_ANIMATION_URL;
  const u = url.replace(/:$/, '').trim();
  const base = S3_ANIM_BASE;
  if (u.startsWith(base + '/') && !u.startsWith(base + '/animations/') && u.endsWith('.fbx')) {
    const filename = u.slice(base.length).replace(/^\/+/, '');
    return `${base}/animations/${filename}`;
  }
  return u;
}

/** Unity 风格过渡：idle↔idle / idle↔speaking 的混合时长与是否 warp（旧动作按比例收尾，更丝滑） */
const TRANSITION = {
  /** 动画切换混合时长（秒），越大越丝滑、越像 Unity Animator 的 Transition Duration */
  crossFadeDuration: 0.55,
  /** true = 旧动作在混合期内按比例“收尾”，避免突兀结束（类似 Unity 的 Exit Time 平滑） */
  warpOutgoing: true,
};

/**
 * 双缓冲：当前播一个 URL，同时预加载 nextAnimationUrl，切换时大概率已进缓存，减少延迟/T-pose。
 * additiveAnimationUrl：可选，叠加层动画（如表情/姿态），会 makeClipAdditive 后与 base 混合。
 * additiveWeight：叠加层权重 0–1，默认 0 表示不显示叠加层。
 */
export const useAnimationManager = (
    vrm,
    animationUrl = DEFAULT_ANIMATION_URL,
    nextAnimationUrl?: string,
    additiveAnimationUrl?: string,
    additiveWeight: number = 0
) => {
    const effectiveAnimationUrl = animationUrl || DEFAULT_ANIMATION_URL;
    // 规范化：修正末尾冒号 + 修正缺少 /animations/ 的 S3 路径（避免 403/404）
    const safeAnimationUrl = typeof effectiveAnimationUrl === 'string'
        ? normalizeAnimationUrl(effectiveAnimationUrl)
        : DEFAULT_ANIMATION_URL;

    /** 预备下一个：与当前不同则预加载，相同则复用同一 URL（保证 hooks 稳定调用） */
    const preloadUrl =
        nextAnimationUrl && nextAnimationUrl !== safeAnimationUrl
            ? normalizeAnimationUrl(nextAnimationUrl.trim())
            : safeAnimationUrl;

    const _additiveTrimmed = additiveAnimationUrl && additiveAnimationUrl.trim();
    const safeAdditiveUrl =
        (_additiveTrimmed && _additiveTrimmed !== '#')
            ? normalizeAnimationUrl(_additiveTrimmed)
            : '';

    const mixerRef = useRef<AnimationMixer | null>(null);
    const currentActionRef = useRef<THREE.AnimationAction | null>(null);
    const idleActionRef = useRef<THREE.AnimationAction | null>(null);
    const additiveActionRef = useRef<THREE.AnimationAction | null>(null);
    const isTransitioningRef = useRef(false);
    const transitionTimeRef = useRef(0);
    const hasMixerRef = useRef(false);
    const animationModeRef = useRef('idle'); // 'idle' | 'mocap'
    const lastMappedTrackCountRef = useRef(0);
    const lastRawTrackCountRef = useRef(0);
    const hasPlayableIdleActionRef = useRef(false);
    
    // ✅ 使用 VRM UUID 追踪模型变化（更可靠）
    const vrmIdRef = useRef<string>('');
    const previousAnimationUrlRef = useRef(safeAnimationUrl);
    /** 用于上报：idleClip 为 null 时的具体原因，便于排查「动画文件加载失败」 */
    const idleClipFailureReasonRef = useRef<string | null>(null);

    // 状态管理
    const [animationState, setAnimationState] = useState({
        isPlayingIdle: false,
        isTransitioning: false,
        hasMixer: false,
        hasPlayableIdleAction: false,
        idleActionRunning: false,
        lastMappedTrackCount: 0,
        lastRawTrackCount: 0,
        currentMode: 'idle',
        isLoading: false,
        error: null
    });

    // ✅ 重新初始化动画管理器（当VRM变化时调用）
    const reinitialize = useCallback((newVrm: any) => {
        console.log('🔄 AnimationManager: 重新初始化动画管理器', {
            oldVrmId: vrmIdRef.current,
            newVrmId: getVrmId(newVrm),
            hasOldMixer: !!mixerRef.current
        });
        
        // ✅ 完全清理旧的混合器
        if (mixerRef.current) {
            console.log('🧹 AnimationManager: 清理旧的动画混合器');
            try {
                // 停止所有动作
                mixerRef.current.stopAllAction();
                
                // 注意：AnimationMixer 没有 uncacheRoot 方法
                // 停止所有动作后，直接置null即可
            } catch (error) {
                console.warn('AnimationManager: 清理旧混合器时出错', error);
            }
            
            mixerRef.current = null;
        }
        
        // ✅ 清空所有动作引用
        idleActionRef.current = null;
        currentActionRef.current = null;
        hasMixerRef.current = false;
        
        // ✅ 为新 VRM 创建新的混合器
        if (newVrm && newVrm.scene) {
            const newMixer = new AnimationMixer(newVrm.scene);
            mixerRef.current = newMixer;
            hasMixerRef.current = true;
            
            console.log('✅ AnimationManager: 为新VRM创建新的混合器', {
                vrmId: getVrmId(newVrm),
                mixerRoot: newMixer.getRoot() === newVrm.scene
            });
        }
        
        // 重置状态
        setAnimationState(prev => ({
            ...prev,
            hasMixer: !!mixerRef.current,
            isPlayingIdle: false,
            isLoading: false
        }));
    }, []);
    
    // ✅ 检测 VRM UUID 变化（使用 UUID 比对象引用更可靠）
    useEffect(() => {
        const currentVrmId = getVrmId(vrm);
        
        if (currentVrmId && currentVrmId !== vrmIdRef.current) {
            console.log('🆕 AnimationManager: 检测到VRM变化', {
                oldVrmId: vrmIdRef.current || '(首次加载)',
                newVrmId: currentVrmId,
                hasOldVrm: !!vrmIdRef.current,
                hasNewVrm: !!vrm
            });
            
            // ✅ 如果是首次加载（没有旧模型），需要初始化混合器
            // ✅ 如果是切换模型，需要重新初始化
            if (!vrmIdRef.current) {
                // 首次加载：如果还没有混合器，会在后续的useEffect中创建
                console.log('🎯 AnimationManager: 首次加载VRM，等待混合器初始化');
            } else {
                // 切换模型：需要重新初始化
                console.log('🔄 AnimationManager: 切换模型，重新初始化动画管理器');
                reinitialize(vrm);
            }
            
            vrmIdRef.current = currentVrmId;
        } else if (!currentVrmId && vrmIdRef.current) {
            // VRM 被移除，清理
            console.log('🧹 AnimationManager: VRM已移除，清理资源');
            if (mixerRef.current) {
                mixerRef.current.stopAllAction();
                mixerRef.current = null;
            }
            idleActionRef.current = null;
            currentActionRef.current = null;
            hasMixerRef.current = false;
            vrmIdRef.current = '';
        }
    }, [vrm, reinitialize]);
    
    // ✅ 仅记录 URL 变化，不停止当前动画；等新 clip 就绪后由下方 init 逻辑做 crossfade，避免切换瞬间 T-pose
    useEffect(() => {
        if (previousAnimationUrlRef.current !== safeAnimationUrl) {
            console.log('🔄 AnimationManager: 检测到动画URL变化（保持当前播放，等新 clip 就绪后 crossfade）', {
                old: previousAnimationUrlRef.current,
                new: safeAnimationUrl
            });
            previousAnimationUrlRef.current = safeAnimationUrl;
        }
    }, [safeAnimationUrl]);

    // 加载FBX：当前播的用 safeAnimationUrl；再拉一个 preloadUrl 进缓存（双缓冲，切换时少等）
    const fbxScene = useFBX(safeAnimationUrl);
    useFBX(preloadUrl);
    // 无 additive 时传主 URL，复用缓存且不触发无效请求（idleAdditiveClip 里 safeAdditiveUrl 为空会 return null）
    const fbxSceneAdditive = useFBX(safeAdditiveUrl || safeAnimationUrl);

    // ✅ 创建动画剪辑（当VRM、fbxScene或URL变化时重新创建）
    const idleClip = useMemo(() => {
        idleClipFailureReasonRef.current = null;
        if (!vrm || !fbxScene) {
            idleClipFailureReasonRef.current = !fbxScene
                ? 'FBX未加载（请检查网络、CORS或URL是否正确）'
                : 'VRM模型未就绪';
            console.warn('AnimationManager: 缺少必要参数，无法创建动画剪辑', {
                hasVRM: !!vrm,
                hasFbxScene: !!fbxScene,
                animationUrl: safeAnimationUrl,
                vrmScene: !!vrm?.scene,
                vrmHumanoid: !!vrm?.humanoid
            });
            return null;
        }

        // ✅ 确保 VRM 完全加载
        if (!vrm.scene || !vrm.humanoid) {
            idleClipFailureReasonRef.current = 'VRM未完全加载（缺少 scene 或 humanoid）';
            console.warn('AnimationManager: VRM未完全加载', {
                hasScene: !!vrm.scene,
                hasHumanoid: !!vrm.humanoid
            });
            return null;
        }

        if (!fbxScene.animations?.length) {
            idleClipFailureReasonRef.current = 'FBX 无动画数据（animations 为空）';
            console.warn('AnimationManager: FBX 场景无动画', {
                animationUrl: safeAnimationUrl,
                animationsLength: fbxScene.animations?.length ?? 0
            });
            return null;
        }

        try {
            lastRawTrackCountRef.current = fbxScene.animations[0]?.tracks?.length ?? 0;
            console.log('AnimationManager: 开始重新映射动画', {
                animationUrl: safeAnimationUrl,
                animationsCount: fbxScene.animations?.length || 0
            });

            const remappedClip = remapAnimationToVrm(vrm, fbxScene);

            if (remappedClip) {
                lastMappedTrackCountRef.current = remappedClip.tracks.length;
                console.log('AnimationManager: 动画重新映射成功', {
                    clipName: remappedClip.name,
                    duration: remappedClip.duration,
                    tracksCount: remappedClip.tracks.length
                });
                return remappedClip;
            }
            lastMappedTrackCountRef.current = 0;
            idleClipFailureReasonRef.current = '重定向为 0 条（FBX 骨骼名与 VRM 不匹配，请查看上方 track 列表）';
            console.warn('AnimationManager: 重新映射返回null');
        } catch (error) {
            lastMappedTrackCountRef.current = 0;
            idleClipFailureReasonRef.current = `重定向异常: ${error instanceof Error ? error.message : String(error)}`;
            console.error('AnimationManager: 重新映射失败', error);
        }

        console.warn('AnimationManager: 无法创建idle剪辑 - 重新映射失败且不能使用原始 clip');
        return null;
    }, [vrm, fbxScene, safeAnimationUrl]);

    // 叠加层剪辑：仅当 safeAdditiveUrl 有值且与 base 不同时创建；makeClipAdditive 转为相对参考帧，可与 base 叠加
    const idleAdditiveClip = useMemo(() => {
        if (!safeAdditiveUrl || !vrm?.scene || !vrm?.humanoid || !fbxSceneAdditive?.animations?.length) return null;
        if (safeAdditiveUrl === safeAnimationUrl) return null;
        try {
            const remapped = remapAnimationToVrm(vrm, fbxSceneAdditive);
            if (!remapped) return null;
            const additiveClip = remapped.clone();
            AnimationUtils.makeClipAdditive(additiveClip);
            return additiveClip;
        } catch (e) {
            console.warn('AnimationManager: additive 剪辑创建失败', e);
            return null;
        }
    }, [vrm, fbxSceneAdditive, safeAdditiveUrl, safeAnimationUrl]);

    // 初始化动画混合器（当vrm、idleClip或animationUrl变化时重新初始化）
    useEffect(() => {
        if (!vrm || !idleClip) {
            additiveActionRef.current = null;
            hasPlayableIdleActionRef.current = false;
            if (mixerRef.current) {
                mixerRef.current.stopAllAction();
                mixerRef.current = null;
                hasMixerRef.current = false;
            }
            const errMsg = !vrm
                ? 'VRM模型未加载'
                : !idleClip
                    ? (idleClipFailureReasonRef.current
                        ? `动画文件加载失败：${idleClipFailureReasonRef.current}`
                        : '动画文件加载失败')
                    : null;
            setAnimationState(prev => ({
                ...prev,
                hasMixer: false,
                isPlayingIdle: false,
                hasPlayableIdleAction: false,
                idleActionRunning: false,
                lastMappedTrackCount: lastMappedTrackCountRef.current,
                lastRawTrackCount: lastRawTrackCountRef.current,
                isLoading: false,
                error: errMsg
            }));
            return;
        }

        // 确保VRM完全加载
        if (!vrm.scene || !vrm.humanoid) {
            setAnimationState(prev => ({
                ...prev,
                isLoading: true,
                error: null
            }));
            return;
        }

        try {
            console.log('AnimationManager: 初始化/重新初始化动画混合器', {
                animationUrl: safeAnimationUrl,
                hasMixer: hasMixerRef.current,
                vrmScene: !!vrm.scene,
                vrmHumanoid: !!vrm.humanoid,
                idleClipName: idleClip?.name,
                idleClipDuration: idleClip?.duration
            });
            
            // ✅ 确保没有旧的混合器（应该已经在之前的useEffect中清理，这里做二次检查）
            if (mixerRef.current) {
                const oldRoot = mixerRef.current.getRoot();
                if (oldRoot !== vrm.scene) {
                    console.log('AnimationManager: 检测到VRM场景变化，清理旧混合器');
                    mixerRef.current.stopAllAction();
                    mixerRef.current = null;
                    hasMixerRef.current = false;
                }
            }
            
            // ✅ 创建新的混合器（如果没有或场景已变化）
            if (!mixerRef.current) {
                console.log('🎯 AnimationManager: 创建新的动画混合器', {
                    vrmId: getVrmId(vrm),
                    vrmScene: !!vrm.scene,
                    vrmHumanoid: !!vrm.humanoid
                });
                const mixer = new AnimationMixer(vrm.scene);
                mixerRef.current = mixer;
                hasMixerRef.current = true;
                console.log('✅ AnimationManager: 混合器创建成功', {
                    vrmId: getVrmId(vrm),
                    rootObject: mixer.getRoot() === vrm.scene,
                    mixerRootUuid: mixer.getRoot()?.uuid
                });
            } else {
                // ✅ 验证混合器绑定到正确的场景
                const mixerRoot = mixerRef.current.getRoot();
                if (mixerRoot !== vrm.scene) {
                    console.warn('⚠️ AnimationManager: 混合器绑定的场景不匹配，重新创建', {
                        expectedSceneUuid: vrm.scene?.uuid,
                        actualRootUuid: mixerRoot?.uuid
                    });
                    mixerRef.current.stopAllAction();
                    const mixer = new AnimationMixer(vrm.scene);
                    mixerRef.current = mixer;
                    hasMixerRef.current = true;
                }
            }

            // ✅ 创建新 clip 对应的 action
            const idleAction = mixerRef.current.clipAction(idleClip);
            if (!idleAction) {
                throw new Error('无法创建idle动作：clipAction返回null');
            }
            idleAction.setEffectiveWeight(1);
            idleAction.setEffectiveTimeScale(1);
            idleAction.setLoop(THREE.LoopRepeat, Infinity);
            idleAction.clampWhenFinished = false;
            idleAction.enabled = true;

            const prevAction = currentActionRef.current;
            const useCrossFade = prevAction && prevAction.isRunning() && prevAction.getClip() !== idleClip;
            const duration = TRANSITION.crossFadeDuration;
            const warp = TRANSITION.warpOutgoing;
            let crossFadeTimeoutId: ReturnType<typeof setTimeout> | null = null;

            if (useCrossFade) {
                // 与 three.js additive animation 示例一致：endAction 必须先 weight=1、time=0 再 crossFadeTo
                idleAction.enabled = true;
                idleAction.setEffectiveTimeScale(1);
                idleAction.setEffectiveWeight(1);
                idleAction.time = 0;
                idleAction.play();
                prevAction.crossFadeTo(idleAction, duration, warp);
                isTransitioningRef.current = true;
                crossFadeTimeoutId = setTimeout(() => {
                    isTransitioningRef.current = false;
                }, duration * 1000);
            } else {
                if (idleActionRef.current && idleActionRef.current !== idleAction) {
                    idleActionRef.current.stop();
                }
                idleAction.reset();
                idleAction.play();
            }

            idleActionRef.current = idleAction;
            currentActionRef.current = idleAction;
            animationModeRef.current = 'idle';
            hasPlayableIdleActionRef.current = true;

            if (additiveActionRef.current) {
                additiveActionRef.current.stop();
                additiveActionRef.current = null;
            }
            if (idleAdditiveClip && mixerRef.current) {
                const additiveAction = mixerRef.current.clipAction(idleAdditiveClip);
                additiveAction.enabled = true;
                additiveAction.setEffectiveTimeScale(1);
                additiveAction.setEffectiveWeight(additiveWeight);
                additiveAction.setLoop(THREE.LoopRepeat, Infinity);
                additiveAction.play();
                additiveActionRef.current = additiveAction;
            }

            setAnimationState({
                isPlayingIdle: true,
                isTransitioning: useCrossFade,
                hasMixer: true,
                hasPlayableIdleAction: true,
                idleActionRunning: idleAction.isRunning?.() ?? true,
                lastMappedTrackCount: lastMappedTrackCountRef.current,
                lastRawTrackCount: lastRawTrackCountRef.current,
                currentMode: 'idle',
                isLoading: false,
                error: null
            });

            if (useCrossFade) {
                console.log('✅ AnimationManager: 交叉淡入', { to: idleAction.getClip().name, duration, warp });
            } else {
                console.log('✅ AnimationManager: 动画混合器初始化/切换', { actionName: idleAction.getClip().name });
            }
            if (idleAdditiveClip) {
                console.log('✅ AnimationManager: additive 层已启用', { clipName: idleAdditiveClip.name, weight: additiveWeight });
            }

            return () => {
                if (crossFadeTimeoutId != null) clearTimeout(crossFadeTimeoutId);
                if (additiveActionRef.current) {
                    additiveActionRef.current.stop();
                    additiveActionRef.current = null;
                }
            };
        } catch (error) {
            console.error('AnimationManager: 初始化失败', error);
            setAnimationState(prev => ({
                ...prev,
                hasMixer: false,
                isPlayingIdle: false,
                hasPlayableIdleAction: false,
                idleActionRunning: false,
                lastMappedTrackCount: lastMappedTrackCountRef.current,
                lastRawTrackCount: lastRawTrackCountRef.current,
                isLoading: false,
                error: error instanceof Error ? error.message : String(error)
            }));
        }
    }, [vrm, idleClip, safeAnimationUrl, idleAdditiveClip, additiveWeight]);

    useEffect(() => {
        const action = additiveActionRef.current;
        if (action) {
            action.setEffectiveWeight(additiveWeight);
        }
    }, [additiveWeight]);

    // 切换到动捕模式
    const switchToMocapMode = () => {
        // 防止重复切换
        if (animationModeRef.current === 'mocap') {
            return;
        }
        
        animationModeRef.current = 'mocap';
        isTransitioningRef.current = true;
        
        try {
            // **完全停止动画**
            if (idleActionRef.current) {
                idleActionRef.current.stop();
                idleActionRef.current.reset();
            }
            
            // **重置动画混合器时间**
            if (mixerRef.current) {
                mixerRef.current.setTime(0);
            }
            
            // **更新React状态**
            setAnimationState(prev => ({
                ...prev,
                currentMode: 'mocap',
                isPlayingIdle: false,
                idleActionRunning: false,
                isTransitioning: false
            }));
            
            isTransitioningRef.current = false;
            
        } catch (error) {
            console.error('AnimationManager: 切换到动捕模式失败', error);
            isTransitioningRef.current = false;
        }
    };

    // 切换到idle模式
    const switchToIdleMode = () => {
        // 防止重复切换
        if (animationModeRef.current === 'idle') {
            return;
        }
        
        animationModeRef.current = 'idle';
        isTransitioningRef.current = true;
        
        try {
            // **重新启动idle动画**
            if (idleActionRef.current) {
                idleActionRef.current.reset();
                idleActionRef.current.play();
            }
            
            // **更新React状态**
            setAnimationState(prev => ({
                ...prev,
                currentMode: 'idle',
                isPlayingIdle: true,
                idleActionRunning: idleActionRef.current?.isRunning?.() ?? true,
                isTransitioning: false
            }));
            
            isTransitioningRef.current = false;
            
        } catch (error) {
            console.error('AnimationManager: 切换到idle模式失败', error);
            isTransitioningRef.current = false;
        }
    };

    // 更新动画
    const updateAnimation = (delta) => {
        // **纯粹模式切换：只在idle模式下更新动画**
        if (animationModeRef.current !== 'idle') {
            return; // 动捕模式下不更新动画
        }
        const mixer = mixerRef.current;
        if (!mixer) return;
        const idleAction = idleActionRef.current;
        try {
            mixer.update(delta);
            const currentTime = mixer.time;
            const isRunning = idleAction?.isRunning?.() ?? false;
            setAnimationState(prev => ({
                ...prev,
                currentTime,
                isPlayingIdle: isRunning,
                idleActionRunning: isRunning
            }));
        } catch (error) {
            console.warn('AnimationManager: 动画更新错误', error);
        }
    };

    // 检查是否应该播放idle动画
    const shouldPlayIdle = (hasHandDetection) => {
        return !hasHandDetection;
    };

    // 状态缓存，避免频繁切换
    const lastModeSwitchTime = useRef(0);
    const lastShouldUseMocap = useRef(false);
    const MODE_SWITCH_DEBOUNCE = 1000; // 1s 防抖，减少手部检测闪烁导致的 idle↔mocap 频繁切换（一阵一阵）

    // 优化的模式切换处理
    const handleModeSwitch = (shouldUseMocap) => {
        const now = Date.now();
        
        // 防抖检查：如果距离上次切换时间太短，则跳过
        if (now - lastModeSwitchTime.current < MODE_SWITCH_DEBOUNCE) {
            return;
        }
        
        // 状态检查：如果状态没有变化，则跳过
        if (shouldUseMocap === lastShouldUseMocap.current) {
            return;
        }
        
        // 记录当前状态
        lastShouldUseMocap.current = shouldUseMocap;
        lastModeSwitchTime.current = now;
        
        // 执行模式切换
        if (shouldUseMocap && animationModeRef.current === 'idle') {
            switchToMocapMode();
        } else if (!shouldUseMocap && animationModeRef.current === 'mocap') {
            switchToIdleMode();
        }
    };

    // 获取当前动画状态
    const getAnimationState = () => {
        return {
            ...animationState,
            isPlayingIdle: animationModeRef.current === 'idle' && !isTransitioningRef.current,
            isTransitioning: isTransitioningRef.current,
            blendFactor: transitionTimeRef.current,
            hasMixer: hasMixerRef.current,
            hasPlayableIdleAction: hasPlayableIdleActionRef.current,
            idleActionRunning: idleActionRef.current?.isRunning?.() ?? false,
            lastMappedTrackCount: lastMappedTrackCountRef.current,
            lastRawTrackCount: lastRawTrackCountRef.current,
            currentMode: animationModeRef.current
        };
    };

    return {
        updateAnimation,
        switchToMocapMode,
        switchToIdleMode,
        handleModeSwitch,
        shouldPlayIdle,
        getAnimationState,
        idleClip,
        
        // 调试方法
        getCurrentMode: () => animationModeRef.current,
        forceIdleRestart: () => {
            if (idleActionRef.current) {
                idleActionRef.current.reset();
                idleActionRef.current.play();
            }
        }
    };
};