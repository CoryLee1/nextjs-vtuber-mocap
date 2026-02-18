import { useFBX } from '@react-three/drei';
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { AnimationMixer, LoopRepeat } from 'three';
import * as THREE from 'three';

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
const STRIP_PREFIXES = ['mixamorig', 'armature|'];

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
 * Key improvements over the old approach:
 *  1. Auto-maps any rig via token normalization (no hardcoded tables)
 *  2. Only remaps .quaternion tracks (rotation retargeting)
 *  3. Only remaps .position for hips (root motion height scaling)
 *  4. Skips .scale tracks entirely (they corrupt bone proportions)
 *  5. VRM 0.x mirror is only applied to hips position, not quaternions
 *     (quaternion rest-pose compensation already handles the mirror)
 */
function remapAnimationToVrm(vrm, fbxScene) {
    if (!vrm?.humanoid || !fbxScene?.animations?.length) {
        console.warn('AnimationManager: missing vrm.humanoid or fbxScene.animations');
        return null;
    }

    // Pick the first clip (works for Mixamo "mixamo.com", UE4 "Unreal Take", or unnamed)
    const srcClip = fbxScene.animations[0];
    if (!srcClip) return null;

    const clip = srcClip.clone();
    const tracks: THREE.KeyframeTrack[] = [];
    const _quatA = new THREE.Quaternion();
    const _vec3 = new THREE.Vector3();
    const restRotInv = new THREE.Quaternion();
    const parentRestWorld = new THREE.Quaternion();

    // Ensure world matrices are up-to-date before reading positions
    fbxScene.updateWorldMatrix(true, true);
    vrm.scene.updateWorldMatrix(true, true);

    // Hips height ratio for position scaling
    const srcHipsNode = fbxScene.getObjectByName("Hips")
        ?? fbxScene.getObjectByName("mixamorigHips")
        ?? fbxScene.getObjectByName("pelvis");
    const srcHipsY = srcHipsNode ? srcHipsNode.getWorldPosition(_vec3).y : 0;
    const vrmHipsNode = vrm.humanoid.getNormalizedBoneNode("hips");
    let vrmHipsY = 1;
    if (vrmHipsNode) {
        vrmHipsY = Math.abs(
            vrmHipsNode.getWorldPosition(_vec3).y -
            vrm.scene.getWorldPosition(_vec3).y
        ) || 1;
    }
    const hipsScale = srcHipsY > 0 ? vrmHipsY / srcHipsY : 1;

    const isVrm0 = vrm.meta?.metaVersion === "0";
    let mapped = 0;

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

        // Auto-map bone name to VRM
        const vrmBoneName = autoMapBoneToVrm(rawBone);
        if (!vrmBoneName) continue;

        // Resolve VRM node
        const vrmNode = vrm.humanoid.getNormalizedBoneNode(vrmBoneName);
        if (!vrmNode) continue;

        // Find source bone in FBX scene graph (needed for rest-pose quaternion)
        const srcNode = fbxScene.getObjectByName(rawBone);
        if (!srcNode) continue;

        if (propName === 'quaternion' && track instanceof THREE.QuaternionKeyframeTrack) {
            // Rest-pose compensation:
            //   result = parentRestWorld * animQuat * localRestInverse
            // Uses LOCAL rest quaternion (not world!) per official three-vrm retarget example
            restRotInv.copy(srcNode.quaternion).invert();
            if (srcNode.parent) {
                srcNode.parent.getWorldQuaternion(parentRestWorld);
            } else {
                parentRestWorld.identity();
            }

            const values = new Float32Array(track.values.length);
            for (let i = 0; i < track.values.length; i += 4) {
                _quatA.set(track.values[i], track.values[i+1], track.values[i+2], track.values[i+3]);
                _quatA.premultiply(parentRestWorld).multiply(restRotInv);

                // VRM 0.x: the model was rotated 180° by rotateVRM0,
                // but normalized bones already account for this — no extra flip needed
                values[i]   = _quatA.x;
                values[i+1] = _quatA.y;
                values[i+2] = _quatA.z;
                values[i+3] = _quatA.w;
            }

            tracks.push(new THREE.QuaternionKeyframeTrack(
                `${vrmNode.name}.quaternion`, track.times, values
            ));
            mapped++;
        }
        else if (propName === 'position' && vrmBoneName === 'hips' && track instanceof THREE.VectorKeyframeTrack) {
            // Auto-detect axis convention from rest pose values:
            //   KAWAII/Unity Z-up (cm): track [X, Y, Z] where Z=height (~95)
            //   Mixamo Y-up: track [X, Y, Z] where Y=height
            const restVal = [track.values[0], track.values[1], track.values[2]];
            const absVals = restVal.map(Math.abs);
            const maxAxis = absVals.indexOf(Math.max(...absVals));
            const srcHeight = Math.abs(restVal[maxAxis]);
            const posScale = srcHeight > 0.01 ? vrmHipsY / srcHeight : 1;

            const values = new Float32Array(track.values.length);
            for (let i = 0; i < track.values.length; i += 3) {
                const raw = [track.values[i], track.values[i+1], track.values[i+2]];
                if (maxAxis === 2) {
                    // Z-up → Y-up conversion: X=X, Y=Z, Z=-Y
                    values[i]   = raw[0] * posScale * (isVrm0 ? -1 : 1);
                    values[i+1] = raw[2] * posScale;
                    values[i+2] = -raw[1] * posScale * (isVrm0 ? -1 : 1);
                } else {
                    // Already Y-up
                    values[i]   = raw[0] * posScale * (isVrm0 ? -1 : 1);
                    values[i+1] = raw[1] * posScale;
                    values[i+2] = raw[2] * posScale * (isVrm0 ? -1 : 1);
                }
            }
            tracks.push(new THREE.VectorKeyframeTrack(
                `${vrmNode.name}.position`, track.times, values
            ));
            mapped++;
        }
        // All other tracks (non-hips position, scale) are intentionally skipped
    }

    if (tracks.length === 0) {
        console.warn('AnimationManager: 0 tracks mapped. Sample track names:',
            clip.tracks.slice(0, 5).map(t => t.name));
        return null;
    }

    console.log(`AnimationManager: retarget OK — ${mapped} tracks from ${clip.tracks.length} (${clip.duration.toFixed(1)}s)`);
    return new THREE.AnimationClip("vrmAnimation", clip.duration, tracks);
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
const DEFAULT_ANIMATION_URL = `${S3_ANIM_BASE}/animations/Idle.fbx`;

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
 */
export const useAnimationManager = (
    vrm,
    animationUrl = DEFAULT_ANIMATION_URL,
    nextAnimationUrl?: string
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

    const mixerRef = useRef<AnimationMixer | null>(null);
    const currentActionRef = useRef<THREE.AnimationAction | null>(null);
    const idleActionRef = useRef<THREE.AnimationAction | null>(null);
    const isTransitioningRef = useRef(false);
    const transitionTimeRef = useRef(0);
    const hasMixerRef = useRef(false);
    const animationModeRef = useRef('idle'); // 'idle' | 'mocap'
    
    // ✅ 使用 VRM UUID 追踪模型变化（更可靠）
    const vrmIdRef = useRef<string>('');
    const previousAnimationUrlRef = useRef(safeAnimationUrl);
    
    // 状态管理
    const [animationState, setAnimationState] = useState({
        isPlayingIdle: false,
        isTransitioning: false,
        hasMixer: false,
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

    // ✅ 创建动画剪辑（当VRM、fbxScene或URL变化时重新创建）
    const idleClip = useMemo(() => {
        if (!vrm || !fbxScene) {
            console.warn('AnimationManager: 缺少必要参数，无法创建动画剪辑', {
                hasVRM: !!vrm,
                hasFbxScene: !!fbxScene,
                vrmScene: !!vrm?.scene,
                vrmHumanoid: !!vrm?.humanoid
            });
            return null;
        }
        
        // ✅ 确保 VRM 完全加载
        if (!vrm.scene || !vrm.humanoid) {
            console.warn('AnimationManager: VRM未完全加载', {
                hasScene: !!vrm.scene,
                hasHumanoid: !!vrm.humanoid
            });
            return null;
        }
        
        try {
            console.log('AnimationManager: 开始重新映射动画', {
                animationUrl: safeAnimationUrl,
                animationsCount: fbxScene.animations?.length || 0
            });
            
            const remappedClip = remapAnimationToVrm(vrm, fbxScene);
            
            if (remappedClip) {
                console.log('AnimationManager: 动画重新映射成功', {
                    clipName: remappedClip.name,
                    duration: remappedClip.duration,
                    tracksCount: remappedClip.tracks.length
                });
                return remappedClip;
            } else {
                console.warn('AnimationManager: 重新映射返回null');
            }
        } catch (error) {
            console.error('AnimationManager: 重新映射失败', error);
        }
        
        // 不再使用原始 FBX clip 作为备用：其 track 名为 mixamorig*，VRM 场景中无对应节点，会导致 T-pose
        console.warn('AnimationManager: 无法创建idle剪辑 - 重新映射失败且不能使用原始 clip');
        return null;
    }, [vrm, fbxScene, safeAnimationUrl]);

    // 初始化动画混合器（当vrm、idleClip或animationUrl变化时重新初始化）
    useEffect(() => {
        if (!vrm || !idleClip) {
            // 清理之前的混合器
            if (mixerRef.current) {
                mixerRef.current.stopAllAction();
                mixerRef.current = null;
                hasMixerRef.current = false;
            }
            
            setAnimationState(prev => ({
                ...prev,
                hasMixer: false,
                isPlayingIdle: false,
                isLoading: false,
                error: !vrm ? 'VRM模型未加载' : !idleClip ? '动画文件加载失败' : null
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
            idleAction.timeScale = 1.0;
            idleAction.setLoop(THREE.LoopRepeat, Infinity);
            idleAction.clampWhenFinished = false;
            idleAction.enabled = true;

            const prevAction = currentActionRef.current;
            const useCrossFade = prevAction && prevAction.isRunning() && prevAction.getClip() !== idleClip;
            const duration = TRANSITION.crossFadeDuration;
            const warp = TRANSITION.warpOutgoing;
            let crossFadeTimeoutId: ReturnType<typeof setTimeout> | null = null;

            if (useCrossFade) {
                idleAction.reset();
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

            setAnimationState({
                isPlayingIdle: true,
                isTransitioning: useCrossFade,
                hasMixer: true,
                currentMode: 'idle',
                isLoading: false,
                error: null
            });

            if (useCrossFade) {
                console.log('✅ AnimationManager: 交叉淡入', { to: idleAction.getClip().name, duration, warp });
            } else {
                console.log('✅ AnimationManager: 动画混合器初始化/切换', { actionName: idleAction.getClip().name });
            }

            return () => {
                if (crossFadeTimeoutId != null) clearTimeout(crossFadeTimeoutId);
            };
        } catch (error) {
            console.error('AnimationManager: 初始化失败', error);
            setAnimationState(prev => ({
                ...prev,
                hasMixer: false,
                isPlayingIdle: false,
                isLoading: false,
                error: error instanceof Error ? error.message : String(error)
            }));
        }
    }, [vrm, idleClip, safeAnimationUrl]); // ✅ 添加safeAnimationUrl到依赖，确保URL变化时重新初始化

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
        
        if (!mixerRef.current) return;
        
        try {
            // 只在idle模式下更新动画混合器
            mixerRef.current.update(delta);
            
            // 更新状态
            setAnimationState(prev => ({
                ...prev,
                currentTime: mixerRef.current.time,
                isPlayingIdle: idleActionRef.current?.isRunning() || false
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
    const MODE_SWITCH_DEBOUNCE = 500; // 500ms防抖时间

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