"use client";

import React, { Suspense, useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useFBX, OrbitControls, Grid } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import * as THREE from "three";

// ─── Universal Auto-Mapper (same as animation-manager.ts) ─────────────────

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

const SYNONYMS: Record<string, string> = {
  hips:'hips',hip:'hips',pelvis:'hips', spine:'spine', chest:'chest',
  upperchest:'upperchest', neck:'neck', head:'head',
  shoulder:'shoulder',clavicle:'shoulder',
  upperarm:'upperarm',arm:'upperarm',
  lowerarm:'lowerarm',forearm:'lowerarm',
  hand:'hand',
  upperleg:'upperleg',upleg:'upperleg',thigh:'upperleg',
  lowerleg:'lowerleg',leg:'lowerleg',calf:'lowerleg',shin:'lowerleg',
  foot:'foot',
  toes:'toes',toe:'toes',toebase:'toes',ball:'toes',
  thumb:'thumb',index:'index',middle:'middle',ring:'ring',
  little:'little',pinky:'little',
  metacarpal:'metacarpal',
  proximal:'proximal','1':'proximal','01':'proximal',
  intermediate:'intermediate','2':'intermediate','02':'intermediate',
  distal:'distal','3':'distal','03':'distal',
};
const SIDE_MAP: Record<string,'left'|'right'> = {
  l:'left',left:'left',_l:'left', r:'right',right:'right',_r:'right',
};
const STRIP_PREFIXES = ['mixamorig','armature|'];
const _cache = new Map<string,string|null>();

function clearAutoMapCache() { _cache.clear(); }

function autoMapBoneToVrm(rawName: string): string | null {
  if (_cache.has(rawName)) return _cache.get(rawName)!;
  let name = rawName;
  for (const p of STRIP_PREFIXES) if (name.toLowerCase().startsWith(p)) name = name.slice(p.length);
  if (name.includes('|')) name = name.split('|').pop()!;
  const lower = name.toLowerCase();
  if (['root','reference','armature'].includes(lower)) { _cache.set(rawName,null); return null; }

  const tokens = name.replace(/([a-z])([A-Z])/g,'$1_$2').split(/[_\s]+/).map(t=>t.toLowerCase()).filter(Boolean);
  let side: 'left'|'right'|'' = '';
  const sideIdx: number[] = [];
  tokens.forEach((t,i) => { const s = SIDE_MAP[t]; if (s) { side=s; sideIdx.push(i); } });
  const body = tokens.filter((_,i) => !sideIdx.includes(i));
  // Compound token merge: try adjacent pairs first ("upper"+"arm" → "upperarm")
  const mapped: string[] = [];
  for (let ci = 0; ci < body.length; ci++) {
    if (ci + 1 < body.length) {
      const compound = body[ci] + body[ci + 1];
      if (SYNONYMS[compound]) { mapped.push(SYNONYMS[compound]); ci++; continue; }
    }
    mapped.push(SYNONYMS[body[ci]] || body[ci]);
  }

  let vrmBone: string|null = null;
  const fingers = ['thumb','index','middle','ring','little'];
  const segs = ['metacarpal','proximal','intermediate','distal'];
  const finger = mapped.find(t => fingers.includes(t));
  const seg = mapped.find(t => segs.includes(t));

  if (finger && seg && side) {
    if (finger==='thumb'&&seg==='proximal') vrmBone=`${side}ThumbMetacarpal`;
    else if (finger==='thumb'&&seg==='intermediate') vrmBone=`${side}ThumbProximal`;
    else if (finger==='thumb'&&seg==='distal') vrmBone=`${side}ThumbDistal`;
    else { const F=finger[0].toUpperCase()+finger.slice(1); const S=seg[0].toUpperCase()+seg.slice(1); vrmBone=`${side}${F}${S}`; }
  } else if (mapped.includes('shoulder')&&side) vrmBone=`${side}Shoulder`;
  else if (mapped.includes('upperarm')&&side) vrmBone=`${side}UpperArm`;
  else if (mapped.includes('lowerarm')&&side) vrmBone=`${side}LowerArm`;
  else if (mapped.includes('hand')&&side) vrmBone=`${side}Hand`;
  else if (mapped.includes('upperleg')&&side) vrmBone=`${side}UpperLeg`;
  else if (mapped.includes('lowerleg')&&side) vrmBone=`${side}LowerLeg`;
  else if (mapped.includes('foot')&&side) vrmBone=`${side}Foot`;
  else if (mapped.includes('toes')&&side) vrmBone=`${side}Toes`;
  else if (mapped.includes('hips')) vrmBone='hips';
  else if (mapped.includes('upperchest')) vrmBone='upperChest';
  else if (mapped.includes('chest')) vrmBone='chest';
  else if (mapped.includes('spine')) {
    const num = body.find(t => /^\d+$/.test(t));
    if (num) { const n=parseInt(num); vrmBone = n<=2?'spine':n===3?'chest':'upperChest'; }
    else vrmBone='spine';
    const idx=body.indexOf('spine'); const nx=body[idx+1];
    if (nx==='1') vrmBone='chest'; if (nx==='2') vrmBone='upperChest';
  } else if (mapped.includes('neck')) vrmBone='neck';
  else if (mapped.includes('head')) vrmBone='head';

  if (vrmBone && !(VRM_BONE_NAMES as readonly string[]).includes(vrmBone)) vrmBone=null;
  _cache.set(rawName, vrmBone);
  return vrmBone;
}

// ─── Per-bone sign flip config ────────────────────────────────────────────

type SignFlip = [number, number, number, number]; // [sx, sy, sz, sw] each ±1
type PerBoneSignFlips = Record<string, SignFlip>; // vrmBoneName → [sx, sy, sz, sw]

// Main body bones (no fingers) for the UI panel
const BODY_BONES = [
  'hips','spine','chest','upperChest','neck','head',
  'leftShoulder','leftUpperArm','leftLowerArm','leftHand',
  'rightShoulder','rightUpperArm','rightLowerArm','rightHand',
  'leftUpperLeg','leftLowerLeg','leftFoot','leftToes',
  'rightUpperLeg','rightLowerLeg','rightFoot','rightToes',
] as const;

// Short display labels
const BONE_LABELS: Record<string, string> = {
  hips:'Hips', spine:'Spine', chest:'Chest', upperChest:'UpChest', neck:'Neck', head:'Head',
  leftShoulder:'L.Shoulder', leftUpperArm:'L.UpArm', leftLowerArm:'L.LoArm', leftHand:'L.Hand',
  rightShoulder:'R.Shoulder', rightUpperArm:'R.UpArm', rightLowerArm:'R.LoArm', rightHand:'R.Hand',
  leftUpperLeg:'L.UpLeg', leftLowerLeg:'L.LoLeg', leftFoot:'L.Foot', leftToes:'L.Toes',
  rightUpperLeg:'R.UpLeg', rightLowerLeg:'R.LoLeg', rightFoot:'R.Foot', rightToes:'R.Toes',
};

const BONE_COLORS: Record<string, string> = {
  hips:'#fff', spine:'#aaddff', chest:'#aaddff', upperChest:'#aaddff', neck:'#aaddff', head:'#aaddff',
  leftShoulder:'#ffcc66', leftUpperArm:'#ffcc66', leftLowerArm:'#ffcc66', leftHand:'#ffcc66',
  rightShoulder:'#66ccff', rightUpperArm:'#66ccff', rightLowerArm:'#66ccff', rightHand:'#66ccff',
  leftUpperLeg:'#ff9966', leftLowerLeg:'#ff9966', leftFoot:'#ff9966', leftToes:'#ff9966',
  rightUpperLeg:'#66ff99', rightLowerLeg:'#66ff99', rightFoot:'#66ff99', rightToes:'#66ff99',
};

// ─── Retarget: returns compiled track data with direct node refs ──────────

interface CompiledTrack {
  node: THREE.Object3D;
  type: 'quaternion' | 'position';
  times: Float32Array;
  values: Float32Array;
  boneName: string;
}

function retargetFbxToVrm(vrm: any, fbxScene: THREE.Group, retargetMode: 'A' | 'B' | 'C' | 'D' | 'E' = 'D', signFlips: PerBoneSignFlips = {}) {
  if (!vrm?.humanoid || !fbxScene?.animations?.length) return null;
  clearAutoMapCache();

  const clip = fbxScene.animations[0];
  const compiledTracks: CompiledTrack[] = [];
  const _quatA = new THREE.Quaternion();
  const _vec3 = new THREE.Vector3();
  const restRotInv = new THREE.Quaternion();
  const parentRestWorld = new THREE.Quaternion();

  // ── Detect Z-up FBX ──────────────────────────────────────────────────────
  // FBXLoader applies a -90° X rotation to the scene root for Z-up files.
  // We detect this by checking the root's quaternion.
  const rootQ = fbxScene.quaternion;
  const isZUp = Math.abs(rootQ.x + Math.SQRT1_2) < 0.05 && Math.abs(rootQ.w - Math.SQRT1_2) < 0.05;
  // Z-up → Y-up quaternion rotation: 90° around X = Quaternion(sin(45°), 0, 0, cos(45°))
  const zUpToYUpQuat = new THREE.Quaternion(Math.SQRT1_2, 0, 0, Math.SQRT1_2); // +90° X
  const zUpToYUpQuatInv = zUpToYUpQuat.clone().invert(); // -90° X

  // Hips height ratio — update matrices first so world positions are valid
  fbxScene.updateWorldMatrix(true, true);
  vrm.scene.updateWorldMatrix(true, true);
  const srcHipsNode = fbxScene.getObjectByName("Hips") ?? fbxScene.getObjectByName("mixamorigHips") ?? fbxScene.getObjectByName("pelvis");
  const srcHipsY = srcHipsNode ? srcHipsNode.getWorldPosition(_vec3).y : 0;
  const vrmHipsNode = vrm.humanoid.getNormalizedBoneNode("hips");
  const vrmRootY = vrm.scene.getWorldPosition(_vec3).y;
  let vrmHipsY = 1;
  if (vrmHipsNode) vrmHipsY = Math.abs(vrmHipsNode.getWorldPosition(_vec3).y - vrmRootY) || 1;
  const hipsScale = srcHipsY > 0 ? vrmHipsY / srcHipsY : 1;
  const isVrm0 = vrm.meta?.metaVersion === "0";

  const log: string[] = [];
  let mapped = 0, skipped = 0;
  log.push(`Hips scale: srcY=${srcHipsY.toFixed(3)} vrmY=${vrmHipsY.toFixed(3)} scale=${hipsScale.toFixed(4)} isVrm0=${isVrm0}`);
  log.push(`Z-up detected: ${isZUp} (rootQ: x=${rootQ.x.toFixed(3)} y=${rootQ.y.toFixed(3)} z=${rootQ.z.toFixed(3)} w=${rootQ.w.toFixed(3)})`);
  log.push(`Retarget mode: ${retargetMode}`);

  // ── Diagnostic: compare FBX rest vs VRM rest vs anim frame0 ────────────
  log.push(`\n═══ BONE REST-POSE DIAGNOSTIC ═══`);
  log.push(`Format: bone | fbxLocal(xyzw) | fbxWorld(xyzw) | vrmNorm(xyzw) | animFrame0(xyzw)`);
  const _diagQ = new THREE.Quaternion();
  const trackMap = new Map<string, THREE.KeyframeTrack>();
  for (const t of clip.tracks) {
    const d = t.name.lastIndexOf('.');
    if (d < 0) continue;
    const prop = t.name.slice(d + 1);
    let bn = t.name.slice(0, d);
    if (bn.includes('|')) bn = bn.split('|').pop()!;
    if (prop === 'quaternion') trackMap.set(bn, t);
  }
  for (const bn of BODY_BONES) {
    // Find FBX bone name that maps to this VRM bone
    let fbxName: string | null = null;
    for (const [key] of trackMap) {
      if (autoMapBoneToVrm(key) === bn) { fbxName = key; break; }
    }
    if (!fbxName) continue;
    const srcNode = fbxScene.getObjectByName(fbxName);
    const vrmNode = vrm.humanoid.getNormalizedBoneNode(bn);
    if (!srcNode || !vrmNode) continue;

    const fl = srcNode.quaternion; // FBX local rest
    srcNode.getWorldQuaternion(_diagQ);
    const fw = { x: _diagQ.x, y: _diagQ.y, z: _diagQ.z, w: _diagQ.w }; // FBX world rest
    const vn = vrmNode.quaternion; // VRM normalized rest (should be identity)
    const track = trackMap.get(fbxName)!;
    const a0 = { x: track.values[0], y: track.values[1], z: track.values[2], w: track.values[3] }; // anim frame 0

    const fmt = (q: any) => `(${q.x.toFixed(3)},${q.y.toFixed(3)},${q.z.toFixed(3)},${q.w.toFixed(3)})`;
    log.push(`  ${(BONE_LABELS[bn] || bn).padEnd(10)} fbxL=${fmt(fl)} fbxW=${fmt(fw)} vrm=${fmt(vn)} anim0=${fmt(a0)}`);
  }
  log.push(`═══════════════════════════════════\n`);

  for (const track of clip.tracks) {
    const dotIdx = track.name.lastIndexOf('.');
    if (dotIdx < 0) continue;
    const propName = track.name.slice(dotIdx + 1);
    let rawBone = track.name.slice(0, dotIdx);
    if (rawBone.includes('|')) rawBone = rawBone.split('|').pop()!;

    if (propName === 'scale') { skipped++; continue; }

    const vrmBoneName = autoMapBoneToVrm(rawBone);
    if (!vrmBoneName) { skipped++; log.push(`SKIP: "${rawBone}" → no VRM mapping`); continue; }

    const vrmNode = vrm.humanoid.getNormalizedBoneNode(vrmBoneName);
    const srcNode = fbxScene.getObjectByName(rawBone);
    if (!vrmNode || !srcNode) { skipped++; log.push(`SKIP: "${rawBone}" → ${vrmBoneName} (node not found)`); continue; }

    if (propName === 'quaternion' && track instanceof THREE.QuaternionKeyframeTrack) {
      // ── Retarget Modes ─────────────────────────────────────────────────
      // A: Raw pass-through (no compensation)
      // B: localRest⁻¹ × anim
      // C: Official three-vrm: parentWorldRest × anim × worldRest⁻¹
      // D: Z→Y convert + official three-vrm formula (RECOMMENDED for Z-up FBX)
      // E: Z→Y convert only (no rest compensation)
      const MODE = retargetMode;

      // World rest quaternions (official three-vrm uses WORLD, not local)
      srcNode.getWorldQuaternion(restRotInv).invert();
      srcNode.parent ? srcNode.parent.getWorldQuaternion(parentRestWorld) : parentRestWorld.identity();

      const values = new Float32Array(track.values.length);
      for (let i = 0; i < track.values.length; i += 4) {
        _quatA.set(track.values[i], track.values[i+1], track.values[i+2], track.values[i+3]);

        if (MODE === 'D' || MODE === 'E') {
          // Convert animation quaternion from Z-up to Y-up space
          // The FBX animation tracks are still in the original Z-up coordinate system.
          // We rotate them into Y-up: q_yup = R_z2y * q_zup * R_z2y_inv
          if (isZUp) {
            _quatA.premultiply(zUpToYUpQuat).multiply(zUpToYUpQuatInv);
          }
        }

        if (MODE === 'B') {
          const localRestInv = new THREE.Quaternion().copy(srcNode.quaternion).invert();
          _quatA.premultiply(localRestInv);
        } else if (MODE === 'C' || MODE === 'D') {
          // Official three-vrm formula: parentWorldRest × anim × worldRest⁻¹
          _quatA.premultiply(parentRestWorld).multiply(restRotInv);
        }
        // Mode A and E: no rest compensation

        // VRM 0.x correction: negate X and Z (mirror for -Z forward)
        if (isVrm0) {
          _quatA.set(-_quatA.x, _quatA.y, -_quatA.z, _quatA.w);
        }

        // Apply per-bone sign flips
        const sf = signFlips[vrmBoneName];
        if (sf) _quatA.set(_quatA.x * sf[0], _quatA.y * sf[1], _quatA.z * sf[2], _quatA.w * sf[3]);

        values[i]=_quatA.x; values[i+1]=_quatA.y; values[i+2]=_quatA.z; values[i+3]=_quatA.w;
      }

      compiledTracks.push({
        node: vrmNode,
        type: 'quaternion',
        times: new Float32Array(track.times),
        values,
        boneName: vrmBoneName,
      });
      mapped++;
      log.push(`OK: "${rawBone}" → ${vrmBoneName} (node: "${vrmNode.name}")`);
    }
    else if (propName === 'position' && vrmBoneName === 'hips' && track instanceof THREE.VectorKeyframeTrack) {
      // Detect axis convention from rest pose: find which raw axis holds the height
      // KAWAII FBX: Z-up in cm → track values [X, Y, Z] where Z=height
      // Mixamo FBX: Y-up → track values [X, Y, Z] where Y=height
      const restVal = [track.values[0], track.values[1], track.values[2]];
      const absVals = restVal.map(Math.abs);
      const maxAxis = absVals.indexOf(Math.max(...absVals)); // axis with largest value = height

      // Compute scale: largest rest value (height in cm or m) → VRM hips height
      const srcHeight = Math.abs(restVal[maxAxis]);
      const posScale = srcHeight > 2 ? vrmHipsY / srcHeight : (srcHeight > 0 ? vrmHipsY / srcHeight : 1);

      log.push(`Hips pos: rest=[${restVal.map(v=>v.toFixed(2))}] heightAxis=${['X','Y','Z'][maxAxis]} srcH=${srcHeight.toFixed(2)} scale=${posScale.toFixed(4)}`);

      const values = new Float32Array(track.values.length);
      for (let i = 0; i < track.values.length; i += 3) {
        const raw = [track.values[i], track.values[i+1], track.values[i+2]];
        if (maxAxis === 2) {
          // Z-up → Y-up: X=X, Y=Z, Z=-Y
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
      compiledTracks.push({
        node: vrmNode,
        type: 'position',
        times: new Float32Array(track.times),
        values,
        boneName: 'hips',
      });
      mapped++;
      log.push(`OK: "${rawBone}" → hips.position (axis=${['X','Y','Z'][maxAxis]}-up, scale=${posScale.toFixed(4)})`);
    }
    else { skipped++; log.push(`SKIP: "${rawBone}.${propName}" (non-hips position)`); }
  }

  return {
    tracks: compiledTracks,
    duration: clip.duration,
    log,
    stats: { total: clip.tracks.length, mapped, skipped },
  };
}

/** Interpolate a value from a keyframe track at a given time */
function sampleTrack(times: Float32Array, values: Float32Array, t: number, stride: number): number[] {
  const n = times.length;
  if (n === 0) return stride === 4 ? [0,0,0,1] : [0,0,0];

  // Clamp time to [0, duration] with looping
  if (t <= times[0]) {
    return Array.from(values.subarray(0, stride));
  }
  if (t >= times[n - 1]) {
    return Array.from(values.subarray((n-1)*stride, n*stride));
  }

  // Binary search for the interval
  let lo = 0, hi = n - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (times[mid] <= t) lo = mid; else hi = mid;
  }

  const alpha = (t - times[lo]) / (times[hi] - times[lo]);
  const result: number[] = [];

  if (stride === 4) {
    // Quaternion SLERP
    const q1x = values[lo*4], q1y = values[lo*4+1], q1z = values[lo*4+2], q1w = values[lo*4+3];
    let q2x = values[hi*4], q2y = values[hi*4+1], q2z = values[hi*4+2], q2w = values[hi*4+3];
    // Ensure shortest path
    let dot = q1x*q2x + q1y*q2y + q1z*q2z + q1w*q2w;
    if (dot < 0) { q2x=-q2x; q2y=-q2y; q2z=-q2z; q2w=-q2w; dot=-dot; }
    if (dot > 0.9999) {
      result.push(q1x+(q2x-q1x)*alpha, q1y+(q2y-q1y)*alpha, q1z+(q2z-q1z)*alpha, q1w+(q2w-q1w)*alpha);
    } else {
      const theta = Math.acos(Math.min(dot, 1));
      const sinTheta = Math.sin(theta);
      const a = Math.sin((1-alpha)*theta)/sinTheta;
      const b = Math.sin(alpha*theta)/sinTheta;
      result.push(a*q1x+b*q2x, a*q1y+b*q2y, a*q1z+b*q2z, a*q1w+b*q2w);
    }
  } else {
    // Linear interpolation
    for (let i = 0; i < stride; i++) {
      result.push(values[lo*stride+i] + (values[hi*stride+i] - values[lo*stride+i]) * alpha);
    }
  }
  return result;
}

// ─── Test animations ───────────────────────────────────────────────────────

const KAWAII_ANIMATIONS = [
  { name: "Idle Breathing", url: "/models/animations/kawaii-test/Idle01_breathing.fbx" },
  { name: "Wave Hands", url: "/models/animations/kawaii-test/WaveHands.fbx" },
  { name: "Dance 01", url: "/models/animations/kawaii-test/Dance01.fbx" },
  { name: "Shy", url: "/models/animations/kawaii-test/Shy.fbx" },
  { name: "Walk", url: "/models/animations/kawaii-test/Walk01.fbx" },
  { name: "Run", url: "/models/animations/kawaii-test/Run01.fbx" },
];

const MIXAMO_ANIMATIONS = [
  { name: "Mixamo Idle", url: "/models/animations/Idle.fbx" },
  { name: "Mixamo Talking", url: "/models/animations/Talking.fbx" },
];

// ─── Manual Animation Player (bypasses AnimationMixer) ───────────────────

const FbxAnimPlayer = memo(function FbxAnimPlayer({
  vrm, animationUrl, onLog, retargetMode, signFlips,
}: { vrm: any; animationUrl: string; onLog: (logs: string[], stats: any) => void; retargetMode: 'A' | 'B' | 'C' | 'D' | 'E'; signFlips: PerBoneSignFlips }) {
  const tracksRef = useRef<CompiledTrack[]>([]);
  const durationRef = useRef(0);
  const timeRef = useRef(0);
  const loggedPosRef = useRef(false);
  const fbxScene = useFBX(animationUrl);

  useEffect(() => {
    if (!vrm?.humanoid || !fbxScene?.animations?.length) return;

    // Diagnostic: check if normalized bones are in vrm.scene
    const diagLines: string[] = [];
    const testBones = ['hips', 'spine', 'head', 'leftUpperArm'];
    for (const bn of testBones) {
      const nNode = vrm.humanoid.getNormalizedBoneNode(bn);
      const rNode = vrm.humanoid.getRawBoneNode(bn);
      if (nNode) {
        const foundInScene = vrm.scene.getObjectByName(nNode.name);
        diagLines.push(`  ${bn}: normalized="${nNode.name}" inScene=${!!foundInScene} | raw="${rNode?.name}" rawInScene=${!!vrm.scene.getObjectByName(rNode?.name)}`);
      }
    }

    const result = retargetFbxToVrm(vrm, fbxScene, retargetMode, signFlips);

    if (result && result.tracks.length > 0) {
      tracksRef.current = result.tracks;
      durationRef.current = result.duration;
      timeRef.current = 0;

      // Log VRM scene position BEFORE animation
      const scenePos = vrm.scene.position;
      const sceneWorldPos = new THREE.Vector3();
      vrm.scene.getWorldPosition(sceneWorldPos);
      const hipsNode = vrm.humanoid.getNormalizedBoneNode("hips");
      const hipsWorldPos = new THREE.Vector3();
      if (hipsNode) hipsNode.getWorldPosition(hipsWorldPos);

      onLog([
        `VRM scene.position: [${scenePos.x.toFixed(3)}, ${scenePos.y.toFixed(3)}, ${scenePos.z.toFixed(3)}]`,
        `VRM scene worldPos: [${sceneWorldPos.x.toFixed(3)}, ${sceneWorldPos.y.toFixed(3)}, ${sceneWorldPos.z.toFixed(3)}]`,
        `VRM hips worldPos: [${hipsWorldPos.x.toFixed(3)}, ${hipsWorldPos.y.toFixed(3)}, ${hipsWorldPos.z.toFixed(3)}]`,
      ], {});

      // Sample first quat track + hips position
      const firstQuat = result.tracks.find(t => t.type === 'quaternion');
      const hipsPos = result.tracks.find(t => t.type === 'position' && t.boneName === 'hips');
      let sampleLine = '';
      if (firstQuat) {
        const v = firstQuat.values;
        const f0 = `[${v[0]?.toFixed(4)}, ${v[1]?.toFixed(4)}, ${v[2]?.toFixed(4)}, ${v[3]?.toFixed(4)}]`;
        const midI = Math.floor(v.length / 8) * 4;
        const fm = `[${v[midI]?.toFixed(4)}, ${v[midI+1]?.toFixed(4)}, ${v[midI+2]?.toFixed(4)}, ${v[midI+3]?.toFixed(4)}]`;
        sampleLine = `Quat sample ${firstQuat.boneName}: frame0=${f0} mid=${fm}`;
      }
      let posSampleLine = '';
      if (hipsPos) {
        const v = hipsPos.values;
        const f0 = `[${v[0]?.toFixed(4)}, ${v[1]?.toFixed(4)}, ${v[2]?.toFixed(4)}]`;
        const midI = Math.floor(v.length / 6) * 3;
        const fm = `[${v[midI]?.toFixed(4)}, ${v[midI+1]?.toFixed(4)}, ${v[midI+2]?.toFixed(4)}]`;
        posSampleLine = `Hips pos sample: frame0=${f0} mid=${fm}`;
      }

      onLog([
        `--- Animation: ${animationUrl} ---`,
        `Mode: MANUAL (direct bone refs, no AnimationMixer)`,
        `Duration: ${result.duration.toFixed(2)}s, Compiled tracks: ${result.tracks.length}`,
        `Stats: ${result.stats.mapped} mapped, ${result.stats.skipped} skipped / ${result.stats.total} total`,
        `Bone diagnostic (normalized nodes in scene?):`,
        ...diagLines,
        sampleLine,
        posSampleLine,
        "",
        ...result.log,
      ], result.stats);
    } else {
      onLog([
        `--- FAILED: ${animationUrl} ---`,
        `Bone diagnostic:`, ...diagLines,
        ...(result?.log || ["No retarget result"]),
      ], result?.stats || {});
    }

    loggedPosRef.current = false;
    return () => { tracksRef.current = []; };
  }, [vrm, fbxScene, animationUrl, onLog, retargetMode, signFlips]);

  // Manual animation: directly set bone quaternions/positions each frame
  useFrame((_, delta) => {
    const tracks = tracksRef.current;
    const duration = durationRef.current;
    if (tracks.length === 0 || duration <= 0) {
      // Still update VRM even without animation
      if (vrm) vrm.update(delta);
      return;
    }

    // Advance time with looping
    timeRef.current = (timeRef.current + delta) % duration;
    const t = timeRef.current;

    // Apply each track directly to the node
    for (const track of tracks) {
      if (track.type === 'quaternion') {
        const vals = sampleTrack(track.times, track.values, t, 4);
        track.node.quaternion.set(vals[0], vals[1], vals[2], vals[3]);
      } else if (track.type === 'position') {
        const vals = sampleTrack(track.times, track.values, t, 3);
        track.node.position.set(vals[0], vals[1], vals[2]);
      }
    }

    // CRITICAL: vrm.update transfers normalized bones → raw bones
    if (vrm) vrm.update(delta);

    // Log position after 1s of animation (once)
    if (!loggedPosRef.current && t > 1.0 && vrm) {
      loggedPosRef.current = true;
      const wp = new THREE.Vector3();
      vrm.scene.getWorldPosition(wp);
      const hp = new THREE.Vector3();
      const hn = vrm.humanoid.getNormalizedBoneNode("hips");
      if (hn) hn.getWorldPosition(hp);
      console.log(`[ANIM @1s] vrm.scene worldPos: [${wp.x.toFixed(3)}, ${wp.y.toFixed(3)}, ${wp.z.toFixed(3)}]`);
      console.log(`[ANIM @1s] hips worldPos: [${hp.x.toFixed(3)}, ${hp.y.toFixed(3)}, ${hp.z.toFixed(3)}]`);
      onLog([
        `[ANIM @1s] vrm.scene worldPos: [${wp.x.toFixed(3)}, ${wp.y.toFixed(3)}, ${wp.z.toFixed(3)}]`,
        `[ANIM @1s] hips worldPos: [${hp.x.toFixed(3)}, ${hp.y.toFixed(3)}, ${hp.z.toFixed(3)}]`,
      ], {});
    }
  });

  return null;
});

// ─── Wiggle Test: verify VRM bones actually work ─────────────────────────

const WiggleTest = memo(function WiggleTest({ vrm }: { vrm: any }) {
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!vrm?.humanoid) return;
    timeRef.current += delta;

    // Wiggle the head left-right
    const headNode = vrm.humanoid.getNormalizedBoneNode("head");
    if (headNode) {
      headNode.quaternion.setFromEuler(
        new THREE.Euler(0, Math.sin(timeRef.current * 2) * 0.3, 0)
      );
    }

    // Wiggle left arm up-down
    const leftUpperArm = vrm.humanoid.getNormalizedBoneNode("leftUpperArm");
    if (leftUpperArm) {
      leftUpperArm.quaternion.setFromEuler(
        new THREE.Euler(0, 0, Math.sin(timeRef.current * 1.5) * 0.5 + 0.5)
      );
    }

    vrm.update(delta);
  });

  return null;
});

// ─── VRM loader + scene ──────────────────────────────────────────────────

// ─── Skeleton Visualizer (sphere per bone) ────────────────────────────────

const _boneWorldPos = new THREE.Vector3();
const BONE_VIZ_COLORS: Record<string, number> = {
  hips:0xffffff, spine:0x88bbff, chest:0x88bbff, upperChest:0x88bbff, neck:0x88bbff, head:0x88bbff,
  leftShoulder:0xffcc44, leftUpperArm:0xffcc44, leftLowerArm:0xffaa22, leftHand:0xff8800,
  rightShoulder:0x44ccff, rightUpperArm:0x44ccff, rightLowerArm:0x22aaff, rightHand:0x0088ff,
  leftUpperLeg:0xff8844, leftLowerLeg:0xff6622, leftFoot:0xff4400, leftToes:0xff2200,
  rightUpperLeg:0x44ff88, rightLowerLeg:0x22ff66, rightFoot:0x00ff44, rightToes:0x00ff22,
};

const SkeletonViz = memo(function SkeletonViz({ vrm }: { vrm: any }) {
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!vrm?.humanoid || !groupRef.current) return;
    const grp = groupRef.current;
    // Clear old
    meshesRef.current.forEach(m => { grp.remove(m); m.geometry.dispose(); (m.material as THREE.Material).dispose(); });
    meshesRef.current = [];

    const geo = new THREE.SphereGeometry(0.012, 6, 6);
    for (const bn of BODY_BONES) {
      const rawNode = vrm.humanoid.getRawBoneNode(bn);
      if (!rawNode) continue;
      const color = BONE_VIZ_COLORS[bn] || 0xaaaaaa;
      const mat = new THREE.MeshBasicMaterial({ color, depthTest: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 999;
      (mesh as any)._trackedBone = rawNode;
      grp.add(mesh);
      meshesRef.current.push(mesh);
    }
    return () => {
      meshesRef.current.forEach(m => { grp.remove(m); (m.material as THREE.Material).dispose(); });
      meshesRef.current = [];
    };
  }, [vrm]);

  useFrame(() => {
    for (const mesh of meshesRef.current) {
      const bone = (mesh as any)._trackedBone as THREE.Object3D;
      if (bone) {
        bone.getWorldPosition(_boneWorldPos);
        mesh.position.copy(_boneWorldPos);
      }
    }
  });

  return <group ref={groupRef} />;
});

const VrmAnimationTest = memo(function VrmAnimationTest({
  animationUrl, onLog, mode, retargetMode, signFlips, showSkeleton,
}: { animationUrl: string; onLog: (logs: string[], stats: any) => void; mode: 'animation' | 'wiggle'; retargetMode: 'A' | 'B' | 'C' | 'D' | 'E'; signFlips: PerBoneSignFlips; showSkeleton: boolean }) {
  const [vrm, setVrm] = useState<any>(null);
  const sceneRef = useRef<THREE.Group | null>(null);

  // Load VRM once
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    const storedModel = localStorage.getItem("echuu_model");
    const tryPaths = [
      storedModel,
      "/models/default-avatar.vrm",
      "https://cdn.glitch.me/29197ca8-24c1-4ca0-bf2d-967df3920e53/AvatarSample_A.vrm",
      "https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm",
    ].filter(Boolean) as string[];

    let cancelled = false;
    const tryNext = (idx: number) => {
      if (idx >= tryPaths.length || cancelled) {
        if (!cancelled) onLog(["ERROR: Could not load any VRM."], {});
        return;
      }
      onLog([`Trying VRM: ${tryPaths[idx]}...`], {});
      loader.load(
        tryPaths[idx],
        (gltf) => {
          if (cancelled) return;
          const loadedVrm = gltf.userData.vrm;
          if (!loadedVrm) { tryNext(idx + 1); return; }

          VRMUtils.rotateVRM0(loadedVrm);
          loadedVrm.scene.position.set(0, 0, 0);

          if (sceneRef.current) {
            while (sceneRef.current.children.length) sceneRef.current.remove(sceneRef.current.children[0]);
            sceneRef.current.add(loadedVrm.scene);
          }

          // Dump detailed bone info
          const bones: string[] = [];
          const normalizedNames: string[] = [];
          for (const bn of VRM_BONE_NAMES) {
            const nNode = loadedVrm.humanoid?.getNormalizedBoneNode(bn);
            const rNode = loadedVrm.humanoid?.getRawBoneNode(bn);
            if (nNode) {
              normalizedNames.push(`${bn}→"${nNode.name}"`);
              bones.push(bn);
            }
          }

          onLog([
            `VRM loaded: ${tryPaths[idx]}`,
            `VRM version: ${loadedVrm.meta?.metaVersion || "?"}`,
            `Mapped bones: ${bones.length}`,
            `Normalized node names (first 8): ${normalizedNames.slice(0, 8).join(", ")}`,
          ], {});

          setVrm(loadedVrm);
        },
        undefined,
        () => tryNext(idx + 1),
      );
    };
    tryNext(0);

    return () => { cancelled = true; };
  }, [onLog]);

  return (
    <group ref={sceneRef}>
      {vrm && mode === 'animation' && (
        <Suspense fallback={null}>
          <FbxAnimPlayer vrm={vrm} animationUrl={animationUrl} onLog={onLog} retargetMode={retargetMode} signFlips={signFlips} />
        </Suspense>
      )}
      {vrm && mode === 'wiggle' && <WiggleTest vrm={vrm} />}
      {vrm && showSkeleton && <SkeletonViz vrm={vrm} />}
    </group>
  );
});

// ─── Page UI ───────────────────────────────────────────────────────────────

export default function TestKawaiiPage() {
  const [selectedAnim, setSelectedAnim] = useState(KAWAII_ANIMATIONS[0]);
  const [logs, setLogs] = useState<string[]>(["Loading... Drop a .vrm or .fbx on the viewport."]);
  const [stats, setStats] = useState<any>({});
  const [mode, setMode] = useState<'animation' | 'wiggle'>('animation');
  const [retargetMode, setRetargetMode] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('D');
  const [customAnims, setCustomAnims] = useState<{ name: string; url: string }[]>([]);
  const [signFlips, setSignFlips] = useState<PerBoneSignFlips>({});
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showFingers, setShowFingers] = useState(false);
  const signFlipKey = JSON.stringify(signFlips);
  const stableSignFlips = useMemo(() => JSON.parse(signFlipKey) as PerBoneSignFlips, [signFlipKey]);
  const logRef = useRef<HTMLDivElement>(null);

  const handleLog = useCallback((newLogs: string[], newStats: any) => {
    setLogs(prev => [...prev, ...newLogs]);
    if (newStats.mapped !== undefined) setStats(newStats);
    setTimeout(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, 50);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (file.name.toLowerCase().endsWith(".fbx")) {
        const url = URL.createObjectURL(file);
        const name = file.name.replace(/\.fbx$/i, "").replace(/^@KA_/, "");
        const anim = { name: `[Local] ${name}`, url };
        setCustomAnims(prev => [...prev, anim]);
        setSelectedAnim(anim);
        setLogs(prev => [...prev, `\nLoaded local FBX: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`]);
      }
    }
  }, []);

  const allAnims = [...KAWAII_ANIMATIONS, ...MIXAMO_ANIMATIONS, ...customAnims];

  return (
    <div style={{ display: "flex", height: "100vh", background: "#1a1a2e", color: "#eee", fontFamily: "monospace" }}>
      <div
        style={{ flex: 1, position: "relative" }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <Canvas camera={{ position: [0, 1.2, 3], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <Grid args={[10, 10]} cellSize={0.5} cellColor="#333" sectionSize={2} sectionColor="#555" fadeDistance={10} />
          <Suspense fallback={null}>
            <VrmAnimationTest
              animationUrl={selectedAnim.url}
              onLog={handleLog}
              mode={mode}
              retargetMode={retargetMode}
              signFlips={stableSignFlips}
              showSkeleton={showSkeleton}
            />
          </Suspense>
          <OrbitControls target={[0, 1, 0]} />
        </Canvas>

        <div style={{
          position: "absolute", top: 10, left: 10, padding: "8px 12px",
          background: "rgba(0,0,0,0.7)", borderRadius: 8, fontSize: 13,
        }}>
          <div style={{ color: "#4fc3f7", fontWeight: "bold", marginBottom: 4 }}>
            KAWAII Animation Test
          </div>
          <div>Mode: <b style={{ color: mode === 'wiggle' ? '#ff9800' : '#66bb6a' }}>
            {mode === 'wiggle' ? 'WIGGLE TEST (head+arm)' : `Animation: ${selectedAnim.name}`}
          </b></div>
          {stats.mapped !== undefined && mode === 'animation' && (
            <div style={{ color: stats.mapped > 0 ? "#66bb6a" : "#ef5350" }}>
              Mapped: {stats.mapped} / {stats.total} tracks
            </div>
          )}
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
            Manual player: direct bone refs, no AnimationMixer.
          </div>
        </div>
      </div>

      <div style={{ width: 460, display: "flex", flexDirection: "column", borderLeft: "1px solid #333" }}>
        {/* Mode toggle */}
        <div style={{ padding: 12, borderBottom: "1px solid #333" }}>
          <h3 style={{ margin: "0 0 8px", color: "#4fc3f7" }}>Mode</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { setMode('animation'); setLogs(prev => [...prev, '\n=== Switched to Animation mode ===']); }}
              style={{
                padding: "6px 14px", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12,
                background: mode === 'animation' ? '#4fc3f7' : '#333',
                color: mode === 'animation' ? '#000' : '#eee',
              }}
            >Animation</button>
            <button
              onClick={() => { setMode('wiggle'); setLogs(prev => [...prev, '\n=== Switched to WIGGLE TEST mode ===\nHead should rotate L/R, left arm should wave up/down.\nIf model moves → VRM pipeline works. If still → VRM setup broken.']); }}
              style={{
                padding: "6px 14px", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12,
                background: mode === 'wiggle' ? '#ff9800' : '#333',
                color: mode === 'wiggle' ? '#000' : '#eee',
              }}
            >Wiggle Test</button>
          </div>
        </div>

        {/* Retarget mode selector */}
        {mode === 'animation' && (
          <div style={{ padding: 12, borderBottom: "1px solid #333" }}>
            <h3 style={{ margin: "0 0 8px", color: "#4fc3f7" }}>Retarget Formula</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {([
                ['D', 'Z→Y + three-vrm (recommended)'],
                ['E', 'Z→Y only (no rest)'],
                ['C', 'three-vrm (Y-up only)'],
                ['A', 'Raw (no compensation)'],
                ['B', 'localRest⁻¹ × anim'],
              ] as const).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => { setRetargetMode(m as any); setLogs(prev => [...prev, `\n=== Retarget mode: ${m} ===`]); }}
                  style={{
                    padding: "5px 10px", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
                    background: retargetMode === m ? '#4fc3f7' : '#333',
                    color: retargetMode === m ? '#000' : '#eee',
                  }}
                >{m}: {label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Per-Bone Sign Flip Panel */}
        {mode === 'animation' && (
          <div style={{ padding: 8, borderBottom: "1px solid #333", fontSize: 11, maxHeight: 340, overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <h3 style={{ margin: 0, color: "#4fc3f7", fontSize: 12 }}>Per-Bone Sign Flips</h3>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => setShowSkeleton(p => !p)}
                  style={{ padding: "2px 6px", background: showSkeleton ? '#4fc3f7' : '#333', color: showSkeleton ? '#000' : '#eee', border: "none", borderRadius: 3, cursor: "pointer", fontSize: 9 }}
                >Skeleton</button>
                <button
                  onClick={() => setShowFingers(p => !p)}
                  style={{ padding: "2px 6px", background: showFingers ? '#4fc3f7' : '#333', color: showFingers ? '#000' : '#eee', border: "none", borderRadius: 3, cursor: "pointer", fontSize: 9 }}
                >{showFingers ? 'Hide Fingers' : 'Show Fingers'}</button>
                <button
                  onClick={() => setSignFlips({})}
                  style={{ padding: "2px 6px", background: "#333", color: "#eee", border: "none", borderRadius: 3, cursor: "pointer", fontSize: 9 }}
                >Reset</button>
                <button
                  onClick={() => {
                    const entries = Object.entries(signFlips).filter(([, v]) => v.some((s: number) => s !== 1));
                    const code = entries.map(([k, v]) => `"${k}": [${v.join(',')}]`).join(', ');
                    navigator.clipboard?.writeText(`{ ${code} }`);
                    setLogs(prev => [...prev, `\nCopied: { ${code} }`]);
                  }}
                  style={{ padding: "2px 6px", background: "#333", color: "#eee", border: "none", borderRadius: 3, cursor: "pointer", fontSize: 9 }}
                >Copy</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "80px repeat(4, 1fr)", gap: 1, alignItems: "center" }}>
              <div style={{ color: "#666", fontSize: 9 }}>Bone</div>
              {['X','Y','Z','W'].map(a => <div key={a} style={{ textAlign: "center", color: "#666", fontWeight: "bold", fontSize: 9 }}>{a}</div>)}
              {BODY_BONES.map(bone => {
                const sf = signFlips[bone] || [1,1,1,1];
                const hasFlip = sf.some((s: number) => s !== 1);
                return (
                  <React.Fragment key={bone}>
                    <div style={{ color: BONE_COLORS[bone] || '#aaa', fontSize: 9, fontWeight: hasFlip ? 'bold' : 'normal' }}>
                      {BONE_LABELS[bone] || bone}
                    </div>
                    {[0,1,2,3].map(axis => (
                      <button
                        key={axis}
                        onClick={() => {
                          setSignFlips(prev => {
                            const cur = prev[bone] || [1,1,1,1] as any;
                            const next = [...cur] as SignFlip;
                            next[axis] = next[axis] === 1 ? -1 : 1;
                            // If all back to +1, remove from map
                            if (next.every(v => v === 1)) {
                              const { [bone]: _, ...rest } = prev;
                              return rest;
                            }
                            return { ...prev, [bone]: next };
                          });
                        }}
                        style={{
                          padding: "2px 0", border: "none", borderRadius: 2, cursor: "pointer",
                          fontSize: 10, fontWeight: "bold", textAlign: "center", lineHeight: 1,
                          background: sf[axis] === 1 ? '#1a2a1a' : '#4a1a1a',
                          color: sf[axis] === 1 ? '#4a8a4a' : '#ef5350',
                        }}
                      >
                        {sf[axis] === 1 ? '+' : '-'}
                      </button>
                    ))}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Animation selector */}
        {mode === 'animation' && (
          <div style={{ padding: 12, borderBottom: "1px solid #333" }}>
            <h3 style={{ margin: "0 0 8px", color: "#4fc3f7" }}>Animations</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {allAnims.map((anim) => (
                <button
                  key={anim.url}
                  onClick={() => {
                    setSelectedAnim(anim);
                    setLogs(prev => [...prev, `\n========== Switching to: ${anim.name} ==========\n`]);
                  }}
                  style={{
                    padding: "6px 12px",
                    background: selectedAnim.url === anim.url ? "#4fc3f7" : "#333",
                    color: selectedAnim.url === anim.url ? "#000" : "#eee",
                    border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12,
                  }}
                >
                  {anim.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Log panel */}
        <div
          ref={logRef}
          style={{
            flex: 1, overflow: "auto", padding: 12, fontSize: 11,
            lineHeight: 1.5, whiteSpace: "pre-wrap", background: "#0d0d1a",
          }}
        >
          {logs.map((line, i) => (
            <div
              key={i}
              style={{
                color: line.startsWith("OK:") ? "#66bb6a"
                  : line.startsWith("SKIP:") ? "#ffb74d"
                  : line.startsWith("ERR") ? "#ef5350"
                  : line.startsWith("---") ? "#4fc3f7"
                  : line.startsWith("Mode:") ? "#ff9800"
                  : "#aaa",
              }}
            >
              {line}
            </div>
          ))}
        </div>

        <div style={{ padding: 8, borderTop: "1px solid #333" }}>
          <button
            onClick={() => setLogs([])}
            style={{ padding: "4px 12px", background: "#333", color: "#eee", border: "none", borderRadius: 4, cursor: "pointer" }}
          >
            Clear Logs
          </button>
        </div>
      </div>
    </div>
  );
}
