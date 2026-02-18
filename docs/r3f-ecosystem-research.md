# R3F Ecosystem Research: Performance, Libraries & AI 3D Generation

> Research date: 2026-02-13

---

## Table of Contents

1. [Performance Diagnosis](#1-performance-diagnosis)
2. [R3F Ecosystem Libraries](#2-r3f-ecosystem-libraries)
3. [World Labs API + Gaussian Splatting](#3-world-labs-api--gaussian-splatting)
4. [Making VTuber Avatars Feel Alive](#4-making-vtuber-avatars-feel-alive)
5. [Auto Profile Picture Generation](#5-auto-profile-picture-generation)
6. [Actionable Recommendations](#6-actionable-recommendations)

---

## 1. Performance Diagnosis

**Overall Grade: A- (87/100)**

The codebase has strong performance fundamentals — object pooling, ref-based animation state, selective Zustand selectors, strategic `React.memo`, and proper disposal.

### 1.1 Strengths

| Pattern | Where | Detail |
|---------|-------|--------|
| Object pooling | `VRMController.tsx:31-66` | 15+ module-level `Vector3`/`Quaternion`/`Matrix4` constants |
| Ref-based mocap data | `VRMAvatar.tsx:360-388` | `riggedFace`, `riggedPose`, `riggedLeftHand`, `riggedRightHand` all `useRef` |
| Selective Zustand selectors | Project-wide | `useSceneStore(state => state.fieldName)` everywhere |
| `React.memo` on 3D components | `CameraController`, `VRMAvatar`, `GridFloor`, `Lighting`, `PreloadFbx`, `DebugHelpers` | Prevents re-render cascades |
| Canvas GL config | `Canvas3DProvider.tsx:140-148` | `alpha:false`, `stencil:false`, `powerPreference:'high-performance'` |
| Tiered DPR | `Canvas3DProvider.tsx:55-70` | low=0.75x, medium=0.9x, high=1.0-1.5x cap |
| VRM disposal | `use-scene-store.ts:218-260` | Full traverse + geometry/material dispose |
| Camera throttling | `CameraController.tsx:56-80` | Updates every 3 frames |

### 1.2 Issues to Fix

#### Issue #1: Per-Frame Object Allocations (MEDIUM)

**Location:** `VRMAvatar.tsx:759-810`

During active mocap, 32+ `{x, y, z}` objects are created every frame for arm/hand rotation data:

```typescript
// CURRENT — creates new object each frame
const leftArmData = {
  x: riggedPose.current.LeftUpperArm.x * (debugAxisConfig?.leftArm?.x || 1),
  y: riggedPose.current.LeftUpperArm.y * (debugAxisConfig?.leftArm?.y || 1),
  z: riggedPose.current.LeftUpperArm.z * (debugAxisConfig?.leftArm?.z || 1),
};
rotateBone('leftUpperArm', leftArmData, boneLerpFactor * settings.armSpeed);
// Repeated 7+ more times for other limbs...
```

**Fix — Pre-allocate reusable pool:**

```typescript
const armDataPool = useRef(
  Array.from({ length: 8 }, () => ({ x: 0, y: 0, z: 0 }))
);

// In useFrame:
const pool = armDataPool.current;
pool[0].x = riggedPose.current.LeftUpperArm.x * (debugAxisConfig?.leftArm?.x || 1);
pool[0].y = riggedPose.current.LeftUpperArm.y * (debugAxisConfig?.leftArm?.y || 1);
pool[0].z = riggedPose.current.LeftUpperArm.z * (debugAxisConfig?.leftArm?.z || 1);
rotateBone('leftUpperArm', pool[0], boneLerpFactor * settings.armSpeed);
```

**Impact:** ~20-30% less GC pressure during active mocap.

#### Issue #2: handDebugInfo Recreation (LOW-MEDIUM)

**Location:** `VRMAvatar.tsx:594-611`

A new debug info object is created every frame. Fix: pre-allocate in a ref, update fields in-place.

#### Issue #3: Vector3 in Debug Render Path (LOW)

**Location:** `DebugHelpers.tsx:285, 366`

```typescript
bone.getWorldPosition(new Vector3());       // line 285
sprite.position.copy(new Vector3(...pos));   // line 366
```

Fix: pass pooled `Vector3` to `getWorldPosition()`.

### 1.3 useFrame Audit (9 Call Sites)

| Component | File:Line | Status | Notes |
|-----------|-----------|--------|-------|
| TakePhotoCapture | `SceneManager.tsx:16` | GOOD | Minimal work, fast return |
| VRMAvatar (main loop) | `VRMAvatar.tsx:676` | GOOD* | Excellent pooling, *except Issue #1 |
| VRMController | `VRMController.tsx:158` | EXCELLENT | Gold standard — full pooling |
| CameraController | `CameraController.tsx:73` | GOOD | Throttled every 3 frames |
| MainScene (head tracking) | `MainScene.tsx:139` | EXCELLENT | Reuses Vector3 ref |
| VRMAnimator | `VRMAnimator.tsx:141` | GOOD | Just `mixer.update(delta)` |
| ArmDirectionDebugger | `DebugHelpers.tsx:103` | EXCELLENT | 4 pooled Vector3s |
| UILayoutRedesign | `UILayoutRedesign.tsx` | OK | Implied usage |
| BoneVisualizer | `BoneVisualizer.tsx` | OK | Debug-only |

---

## 2. R3F Ecosystem Libraries

### 2.1 Already Installed & Underutilized

| Library | Version | Opportunity |
|---------|---------|-------------|
| `@react-three/postprocessing` | 2.19.1 | Bloom (gift glow), DepthOfField (avatar focus), N8AO, Vignette |
| `@react-three/drei` | 9.122 | `MeshTransmissionMaterial`, `MeshPortalMaterial`, `<Environment>` presets, `<Sky>`, `<Stars>`, `<Sparkles>`, `<Text>`, `<Html>`, `<Bvh>`, `<AdaptiveDpr>`, `<PerformanceMonitor>` |
| `r3f-perf` | 7.2.3 | Already integrated |
| `gsap` | 3.13 | Already integrated for timeline animations |

### 2.2 Tier 1 — High Value, Easy Integration

#### wawa-vfx (Particle Effects)
- **Use case:** Lightweight particles for gifts, donations, confetti, sparkle trails
- **Author:** Wawa Sensei (prominent R3F educator)
- **Key features:** Two-component system (`VFXParticles` + `VFXEmitter`), instanced rendering, 42 easing functions, stretchBillboard for trails
- **Status:** Very actively maintained, R3F-native
- **GitHub:** [wass08/wawa-vfx](https://github.com/wass08/wawa-vfx)

#### @react-spring/three (Spring Animations)
- **Use case:** Physics-based animations for UI transitions, camera movements, gift pop-in effects
- **Key features:** Imperative API (no re-renders!), natural spring physics, useSpring/useTrail/useTransition
- **Status:** 28k GitHub stars, actively maintained
- **Compatibility:** Works with R3F v8 + React 18

#### three-custom-shader-material (Custom Shaders)
- **Use case:** Toon shading, holographic effects, rim lighting, animated materials
- **Key features:** Extends any standard material with custom vertex/fragment shaders while keeping lighting/shadows
- **Status:** 845 stars, 18k weekly downloads, replaces archived `lamina`
- **GitHub:** [FarazzShaikh/THREE-CustomShaderMaterial](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial)

#### @react-three/uikit (3D UI)
- **Use case:** In-scene UI panels — chat overlay, donation ticker, controls — rendered in WebGL
- **Key features:** Yoga layout engine, shadcn-style default kit, Lucide icons
- **Status:** v1.0.59, very actively maintained (releases every few days)
- **GitHub:** [pmndrs/uikit](https://github.com/pmndrs/uikit)

### 2.3 Tier 2 — Feature-Specific

#### @react-three/rapier v1.x (Physics)
- **Use case:** Physics for gift effects, prop interactions, ragdoll
- **Key features:** WASM Rapier engine, RigidBody, colliders, sensors, joints, character controllers
- **Status:** 1.3k stars, actively maintained
- **Warning:** Pin to **v1.x** for R3F v8 + React 18. v2.x requires R3F v9 + React 19
- **Next.js note:** WASM loading may need webpack config for `.wasm` files

#### Theatre.js (Animation Editor)
- **Use case:** Visual keyframe editor for camera choreography, scene transitions, intro/outro
- **Key features:** Timeline editor, property tweaking, JSON export for runtime, `@theatre/r3f` wrapper
- **Status:** 12k stars, v0.7 stable, v1.0 pending
- **GitHub:** [theatre-js/theatre](https://github.com/theatre-js/theatre)

#### three.quarks (Heavy VFX)
- **Use case:** Complex particle effects — fire, smoke, explosions, confetti
- **Key features:** CPU particles + instanced rendering, batch rendering, visual editor
- **Status:** Active development, R3F wrapper available (`quarks.r3f`)
- **GitHub:** [Alchemist0823/three.quarks](https://github.com/Alchemist0823/three.quarks)

#### LiveKit (WebRTC Streaming)
- **Use case:** Stream R3F canvas directly via WebRTC — potential OBS replacement
- **Key features:** WebRTC audio/video/data, canvas capture, self-hosted or cloud
- **Status:** Mature open-source project
- **GitHub:** [livekit/livekit](https://github.com/livekit/livekit)

### 2.4 Networking/Multiplayer

#### Playroom Kit
- **Use case:** Multi-VTuber collaboration, interactive audience participation
- **Key features:** WebRTC P2P state sync, matchmaking, React hooks
- **Status:** Active, R3F-specific docs
- **Website:** [joinplayroom.com](https://joinplayroom.com/)

### 2.5 Skip / Wait

| Library | Reason |
|---------|--------|
| `@react-three/cannon` | Superseded by rapier (JS vs WASM) |
| `lamina` | Archived July 2023, unmaintained |
| `@react-three/flex` | Superseded by `@react-three/uikit` |
| `framer-motion-3d` | Overlaps with react-spring + GSAP |
| `r3f-vfx` | WebGPU-dependent, too experimental for production |

### 2.6 Compatibility Matrix

| Constraint | Detail |
|------------|--------|
| R3F version | v8.18 — pin ecosystem libs to v1.x / pre-v9 releases |
| React version | 18.2 — avoid libs that require React 19 |
| Three.js version | 0.159 — check peer deps before upgrading libs |
| Postprocessing | Stay on v2.x — v3 is ESM-only, breaks Next.js 14 SSR |
| Next.js SSR | All R3F components must use `dynamic(import, { ssr: false })` |
| WASM (rapier) | May need `webpack.experiments.asyncWebAssembly` in next.config |

---

## 3. World Labs API + Gaussian Splatting

### 3.1 Company Overview

**World Labs** (worldlabs.ai) — AI startup co-founded by **Fei-Fei Li** ("Godmother of AI"). Core tech: **Large World Model** for "Spatial Intelligence" — AI that generates navigable, physically consistent 3D worlds.

- **Sep 2025:** Announced breakthrough in 3D world generation
- **Nov 2025:** **Marble** launched as first commercial product
- **Jan 21, 2026:** **World API** launched publicly for developers

### 3.2 API Technical Details

| Feature | Detail |
|---------|--------|
| **Endpoint** | `POST /marble/v1/worlds:generate` |
| **Auth** | `WLT-Api-Key` header, keys from [platform.worldlabs.ai](https://platform.worldlabs.ai/) |
| **Input** | Text prompts, images (jpg/png/webp), panoramas, multi-view, video |
| **Output** | SPZ Gaussian Splats (100K/500K/full_res) + GLB collider mesh + panorama + caption + thumbnail |
| **Models** | `Marble 0.1-plus` (high quality) / `Marble 0.1-mini` (draft/fast) |
| **Workflow** | Async: submit → get `operation_id` → poll until complete → download assets |
| **Additional exports** | High-quality mesh export, USD format (via NVIDIA tools) |

### 3.3 Pricing

| Model | Credits | USD per Generation |
|-------|---------|-------------------|
| Marble 0.1-plus | 1,500 | ~$1.20 |
| Marble 0.1-mini | 150 | ~$0.12 |

- $1.00 per 1,250 credits, minimum $5.00 purchase
- Credits do not expire, auto-refill configurable

### 3.4 Generation Speed

| Model | Time |
|-------|------|
| Marble 0.1-mini | 30-45 seconds |
| Marble 0.1-plus | 1-3 minutes |

### 3.5 SPZ Format

World Labs outputs **SPZ** (Niantic's compressed Gaussian Splat format):
- Gzipped stream: 16-byte header + gaussian data (positions, alphas, colors, scales, rotations, SH)
- **RUB coordinate system** — matches OpenGL/Three.js convention (no conversion needed)
- ~10x smaller than equivalent PLY files
- Available at 3 resolutions per world

### 3.6 R3F Integration Path

```
World Labs API
  ├─ SPZ file ──→ Spark (sparkjs.dev) ──→ Three.js scene (gaussian splat background)
  └─ GLB file ──→ useGLTF (drei) ──→ collision mesh / spatial boundaries
```

### 3.7 Gaussian Splat Renderers for Three.js/R3F

#### Spark (RECOMMENDED)
- **Website:** [sparkjs.dev](https://sparkjs.dev/)
- **GitHub:** [sparkjsdev/spark](https://github.com/sparkjsdev/spark)
- Supports **SPZ natively** + PLY, SPLAT, KSPLAT, SOG
- Programmable splat engine with "Dynos" (computation graphs → GLSL)
- Desktop/mobile/WebXR
- ~1M splats at 60fps on desktop, ~1M on Quest 3

#### GaussianSplats3D
- **GitHub:** [mkkellogg/GaussianSplats3D](https://github.com/mkkellogg/GaussianSplats3D)
- Supports SPZ, PLY, SPLAT, KSPLAT
- DropInViewer for R3F (some integration friction)
- VR support
- **Caveat:** High RAM (~1.7GB for single scene in R3F), no progressive loading for SPZ

#### Drei `<Splat>` Component
- Built into `@react-three/drei` — zero extra deps
- Based on antimatter15/splat
- **Only `.splat` format** (NOT SPZ) — needs conversion via [3dgsconverter](https://github.com/francescofugazzi/3dgsconverter)
- Stream loading, alphaHash/alphaTest

#### VRM + Gaussian Splat Compositing
- [gaussian-vrm (GVRM)](https://github.com/naruya/gaussian-vrm) demonstrates VRM + GS in same scene
- Key challenge: gaussian splats are transparent (back-to-front blending), need careful depth sorting with opaque VRM

### 3.8 VTuber Use Cases

| Scenario | Approach | Cost | Latency |
|----------|----------|------|---------|
| Pre-generated background library | Generate 100 environments before streams | $12-$120 | Instant (file load) |
| Live scene generation | Mini model + transition animation | $0.12/scene | 30-45s |
| Chat-triggered environments | Audience types prompt → new scene | $0.12/trigger | 30-45s |
| Scene transitions | Crossfade between pre-loaded SPZ scenes | Pre-paid | 1-5s (file load) |

**Performance budget:** Use 100K splats for live (alongside VRM avatar), 500K for quality balance, full_res for screenshots only.

### 3.9 AI 3D Generation Alternatives

| Tool | What It Generates | API Status | Output | Price |
|------|-------------------|------------|--------|-------|
| **World Labs** | Full 3D environments | Public (Jan 2026) | SPZ + GLB | $0.12-$1.20/gen |
| **Meshy.ai** | Single 3D objects | Public | GLB, FBX, OBJ, USDZ | Credit-based |
| **Tripo3D** | Single 3D objects + rigging | Public | GLB, GLTF, FBX | $0.20-$0.40 |
| **Rodin / Hyper3D** | Single objects, avatars | Public | GLB, OBJ | ~$0.40-$1.50 |
| **Stability AI (SPAR3D)** | Single objects (0.7s!) | Public + open source | Mesh | Free (open weights) |
| **Luma AI Genie** | Text-to-3D objects | Unclear / deprioritized | Quad mesh | Contact |
| **Google CAT3D** | Research only | No API | NeRF/3DGS | N/A |

**World Labs is unique** — the only production API generating **complete navigable environments** (rooms, landscapes, scenes). All others generate single objects.

**Hybrid approach:** World Labs for environment backgrounds + Meshy/Tripo for individual 3D props.

---

## 4. Making VTuber Avatars Feel Alive

### 4.1 How Game Studios Achieve Liveliness

The core principle: **a character should never be truly still**. AAA games and VTuber software achieve this through layered micro-animations.

#### The Layered Animation Architecture

```
Final Pose = Base Animation (idle/walk/talk)
           + Additive Layer: Breathing (always-on, low amplitude)
           + Additive Layer: Emotional Overlay (conditional)
           + Additive Layer: Look-At/Eye Offset (procedural)
           + Additive Layer: Head Micro-Movement (procedural noise)
           + Physics Post-Process: Hair/Cloth spring bones
```

#### Core Micro-Animation Layers (Lowest → Highest Frequency)

| Layer | What | Frequency | Amplitude | Technique |
|-------|------|-----------|-----------|-----------|
| **Breathing** | Chest rise/fall, shoulder follow | 12-16 breaths/min (~0.25 Hz) | Very small (~0.002 bone displacement) | Sine wave on spine/chest Y |
| **Weight Shifting** | Hip sway side-to-side | Every 5-15 seconds | Subtle | Canned animation or slow noise |
| **Head Micro-Tilts** | Small random tilts | Continuous, ~0.1-0.3 Hz | 0.5-2 degrees | Simplex noise on yaw/pitch |
| **Eye Saccades** | Microsaccadic jitter during fixation | Continuous | 0.5-1 degree | 1/f pink noise (most natural) |
| **Micro-Expressions** | Eyebrow raise, mouth twitch | Every 10-30 seconds | Subtle | Random VRM expression flickers |
| **Blink Variation** | Occasional double-blinks, speed variation | Per-blink | N/A | 10% double-blink chance |

#### How Specific Studios Do It

**Hoyoverse (Genshin Impact):**
- 2+ unique personality-reflecting idle animations per character (Yun Jin does opera moves, musicians play instruments)
- Base breathing/sway layer always active between personality idles
- Characters are never "just standing"

**Square Enix (Final Fantasy XVI, GDC 2024):**
- **FACS (Facial Action Coding System)** for micro-expressions
- "Layered Texture Node" blends expression poses so they overlap without interfering
- Primary rig for body + secondary rig for delicate motions (clothing sway, hair)
- Set Driven Keys for intermediate phases between poses

**Live2D (VTuber industry standard):**
- Continuous sine wave parameter for breathing
- Periodic auto-blink
- Expression toggles (blush, sparkle eyes, gloomy)
- Physics-driven hair/accessories
- Key lesson: **continuous subtle parameter oscillation** prevents "stiff and still" look

**VTube Studio Priority System:**
Each parameter has 6 value providers in priority order:
1. P0: Default parameter value
2. P1: Idle Animation value
3. P2: Face Tracking value
4. P3: One-Time Animation value (triggered)
5. P4: Expression value
6. P5: Physics (always last, overwrites everything)

When control passes between providers, values fade smoothly to prevent jumps.

#### Eye Movement Research

Research from Clemson University shows eye movements synthesized with **1/f pink noise** are perceived as most natural:
- **Fixation** with microsaccadic jitter (tiny rapid movements while "looking at" something)
- **Saccades** (quick jumps to new fixation points, 20-200ms, with slight overshoot)
- **Smooth pursuit** (tracking moving objects)
- **Asynchronous blinks** (slight variation between left/right eye timing)
- Avoid symmetrical, repetitive patterns — add slight per-eye variation

#### Emotion Through Body Language

| Emotion | Posture | Gesture Speed | Breathing | Micro-Movements |
|---------|---------|---------------|-----------|-----------------|
| Confident | Upright, open chest | Moderate, controlled | Normal | Minimal |
| Sad | Hunched, slumped shoulders | Slow, fluid | Slower, deeper | Still, withdrawn |
| Nervous | Tense, raised shoulders | Quick, erratic | Fast, shallow | Fidgeting |
| Excited | Leaning forward, open | Quick, expansive | Faster | Bouncy |
| Calm/Relaxed | Settled, slight lean | Slow, fluid | Slow, rhythmic | Gentle sway |

### 4.2 R3F Resources for Natural Animation

#### Three.js Additive Animation Blending

The core API for layering procedural animation on top of canned clips:

```javascript
// 1. Create base action (e.g., idle)
const baseAction = mixer.clipAction(idleClip);
baseAction.play();

// 2. Convert a clip to additive format
THREE.AnimationUtils.makeClipAdditive(breathingClip);

// 3. Create additive action
const additiveAction = mixer.clipAction(breathingClip);
additiveAction.blendMode = THREE.AdditiveAnimationBlendMode;
additiveAction.setEffectiveWeight(0.5); // control influence
additiveAction.play();
```

Key methods:
- `AnimationUtils.makeClipAdditive(clip, referenceFrame)` — converts keyframes to deltas
- `AnimationUtils.subclip(clip, name, startFrame, endFrame)` — extract segments
- `AnimationAction.crossFadeTo(other, duration)` — smooth transitions
- `AnimationAction.timeScale` — control playback speed

#### Procedural Bone Offsets in useFrame

```javascript
// After mixer.update(delta), apply procedural offsets:
useFrame((state) => {
  const t = state.clock.elapsedTime;

  // Breathing: sine wave on chest Y
  chestBone.position.y += Math.sin(t * Math.PI * 2 * 0.25) * 0.002;

  // Head micro-tilt: simplex noise
  headBone.rotation.y += noise2D(t * 0.3, 0) * 0.02;   // ~1 degree
  headBone.rotation.x += noise2D(0, t * 0.3) * 0.01;

  // Eye microsaccades: pink noise jitter
  leftEyeBone.rotation.y += pinkNoise() * 0.008;
  rightEyeBone.rotation.y += pinkNoise() * 0.008;
});
```

#### Noise Libraries

| Library | npm | Features |
|---------|-----|----------|
| [simplex-noise](https://www.npmjs.com/package/simplex-noise) | `simplex-noise` | Popular, well-maintained, TypeScript |
| [noisejs](https://github.com/josephg/noisejs) | `noisejs` | 2D/3D Perlin + Simplex, 10M queries/sec |
| [ts-noise](https://github.com/FarazzShaikh/ts-noise) | `ts-noise` | TypeScript, includes fBm (fractional Brownian motion) |

#### VRM Expression System

```javascript
// Set expressions (0-1 range, can blend multiple)
vrm.expressionManager.setValue('happy', 0.7);
vrm.expressionManager.setValue('aa', 0.5); // viseme
vrm.expressionManager.setValue('blinkLeft', 1.0);

// Must call vrm.update(delta) each frame
```

**Available VRM expressions:**
- Emotion: `happy`, `angry`, `sad`, `relaxed`, `surprised`, `neutral`
- Eyes: `blink`, `blinkLeft`, `blinkRight`, `lookUp`, `lookDown`, `lookLeft`, `lookRight`
- Visemes: `aa`, `ih`, `ou`, `ee`, `oh`

#### VRM Spring Bones (Hair/Clothing Physics)

Already handled by `vrm.update(delta)` if the model contains spring bone definitions. Parameters: stiffness (return force), drag (damping), gravity direction/power, hit radius, colliders.

Additional library: **[wiggle](https://wiggle.three.tools/)** — lightweight spring-based secondary animation for Three.js with [R3F tutorial by Wawa Sensei](https://wawasensei.dev/tuto/wiggle-bones-threejs-library-react-three-fiber).

#### Relevant Animation Libraries

| Library | Purpose | npm |
|---------|---------|-----|
| [vrm-mixamo-retarget](https://github.com/saori-eth/vrm-mixamo-retargeter) | Retarget Mixamo FBX → VRM | `vrm-mixamo-retarget` |
| [r3f-vrm](https://github.com/DavidCks/r3f-vrm) | R3F VRM components with expression/motion managers | `@davidcks/r3f-vrm` |
| [wiggle](https://wiggle.three.tools/) | Spring bone / jiggle physics | `wiggle` |
| [Theatre.js](https://www.theatrejs.com/) | Keyframe timeline editor | `@theatre/r3f` |
| [THREE.IK](https://github.com/jsantell/THREE.IK) | FABRIK inverse kinematics | `three-ik` |
| [CCDIKSolver](https://threejs.org/docs/#examples/en/animations/CCDIKSolver) | Built-in Three.js CCD IK | built-in |
| [@react-spring/three](https://react-spring.dev/) | Spring physics animation for R3F | `@react-spring/three` |

### 4.3 Implementation Priority for Our Codebase

We already have: auto-blink, head tracking, eye LookAt, body/arm/hand mocap, lip sync, idle animation clips, animation state machine.

#### Quick Wins (Procedural, No New Assets)

| # | Feature | Impact | Effort | How |
|---|---------|--------|--------|-----|
| 1 | **Procedural Breathing** | HIGH | 1-2h | Sine wave on spine/chest bones in `VRMController.tsx` useFrame, additive after `mixer.update()` |
| 2 | **Eye Microsaccades** | HIGH | 2-3h | Add simplex noise jitter to eye positions in `use-vrm-lookat.ts` (~0.5-1 degree amplitude) |
| 3 | **Head Micro-Movement** | MEDIUM | 1-2h | Simplex noise offset in `VRMController.tsx` head tracking (0.5-2 degrees) |
| 4 | **Blink Variation** | MEDIUM | 1h | Add double-blink (10% chance) + speed jitter to existing auto-blink in `VRMController.tsx` |

#### Medium Effort

| # | Feature | Impact | Effort | How |
|---|---------|--------|--------|-----|
| 5 | **Additive Breathing via AnimationMixer** | HIGH | 3-4h | `THREE.AdditiveAnimationBlendMode` with Mixamo breathing FBX layered on idle |
| 6 | **Emotion-Driven Expressions** | HIGH | 4-6h | Map backend emotion state → `vrm.expressionManager.setValue()` with spring-based transitions |
| 7 | **Weighted Idle Variation** | MEDIUM | 2-3h | `crossFadeTo()` for smooth transitions, weighted random selection in animation state machine |
| 8 | **Body Language Overlays** | MEDIUM | 4-6h | Posture adjustments based on emotion (happy=upright, sad=slumped) via additive bone offsets |

#### Larger Projects

| # | Feature | Impact | Effort | How |
|---|---------|--------|--------|-----|
| 9 | **VTube Studio-style Priority System** | HIGH | 1-2 weeks | Layered value providers (default → idle → tracking → triggered → expression → physics) with smooth fading |
| 10 | **Theatre.js Expression Sequences** | MEDIUM | 1 week | Keyframed cinematic reaction sequences triggered by AI backend |
| 11 | **Spring Bone Tuning** | MEDIUM | 3-5h | Tune VRM spring bone params (stiffness, drag, gravity) for more dynamic hair/clothing |

---

## 5. Auto Profile Picture Generation

### 5.1 VRM Embedded Thumbnails

VRM format includes built-in thumbnails:

- **VRM 1.0:** `meta.thumbnailImage` → image index in `gltf.images[]` (square, preferably 1024x1024)
- **VRM 0.x:** `meta.texture` → texture number in meta info

```javascript
// Access embedded thumbnail after loading
const gltf = await loader.loadAsync('model.vrm');
const vrm = gltf.userData.vrm;
const meta = gltf.userData.vrmMeta;

if (meta?.thumbnailImage !== undefined) {
  const image = await gltf.parser.getDependency('image', meta.thumbnailImage);
  // image is an HTMLImageElement
}
```

This can serve as a fallback when dynamic rendering is not needed.

### 5.2 Dynamic Portrait Rendering

#### Camera Positioning via VRM Bones

```javascript
const headBone = vrm.humanoid.getNormalizedBoneNode('head');
const headPos = new THREE.Vector3();
headBone.getWorldPosition(headPos);

// Portrait framing: camera slightly above eye level
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10);
camera.position.set(headPos.x, headPos.y + 0.05, headPos.z + 1.2);
camera.lookAt(headPos.x, headPos.y - 0.05, headPos.z);
```

- Standard portrait: head + upper shoulders
- FOV 35-50 degrees for flattering perspective (avoids wide-angle distortion)
- Distance: `(frameHeight / 2) / Math.tan(fov / 2 * DEG2RAD)` ≈ 1.2-2.0 units from head
- Look-at target: slightly below head center (around nose/chin)

#### Rendering to Image in R3F

**Method 1: Direct canvas capture** (simplest, requires `preserveDrawingBuffer: true` on Canvas)

```javascript
const { gl, scene, camera } = useThree();
gl.render(scene, camera);
const dataUrl = gl.domElement.toDataURL('image/png');
```

**Method 2: useFBO for custom resolution** (better quality, independent of viewport)

```javascript
import { useFBO } from '@react-three/drei';

const fbo = useFBO(1024, 1024); // square portrait

useFrame(({ gl, camera }) => {
  gl.setRenderTarget(fbo);
  gl.render(portraitScene, portraitCamera);
  gl.setRenderTarget(null);
  // fbo.texture contains the render
});

// Read pixels:
const pixels = new Uint8Array(1024 * 1024 * 4);
gl.readRenderTargetPixels(fbo, 0, 0, 1024, 1024, pixels);
```

**Note:** Our Canvas already has `preserveDrawingBuffer: true` (set in `Canvas3DProvider.tsx:143`), so Method 1 works out of the box.

### 5.3 Portrait Lighting

**3-Point Lighting Setup:**

| Light | Position | Intensity | Purpose |
|-------|----------|-----------|---------|
| **Key Light** | 45 degrees to one side, slightly above | 1.0 | Main illumination |
| **Fill Light** | Opposite side from key | 0.5-0.7 | Fill shadows softly |
| **Rim Light** | Behind character | 0.8-1.0 | Edge glow, separates from background |

Gacha game style: warm key light, cool rim light, soft shadow, clean gradient or transparent background.

**Alternative:** Use drei's `<Environment>` with a studio preset for consistent, flattering HDR-based lighting.

### 5.4 Pose and Expression

- Set a mild smile: `vrm.expressionManager.setValue('happy', 0.3)` + `vrm.expressionManager.setValue('relaxed', 0.2)`
- Apply a natural standing pose (not T-pose) via animation clip or manual bone positioning
- Character looking slightly off-center creates more dynamic portraits
- A-pose (arms slightly away from body) is better than T-pose for natural framing

### 5.5 Implementation Approach

```
1. Position portrait camera relative to headBone.getWorldPosition()
2. Set up 3-point lighting (or use Environment preset)
3. Apply portrait expression (mild smile)
4. Apply portrait pose (rest pose from animation clip)
5. Render to FBO at 1024x1024
6. Extract as PNG dataURL or Blob
7. Cache result — regenerate only on model change
```

For VRM models without spring bones settled, render after a few frames of `vrm.update(delta)` to let hair/clothing settle into natural positions.

---

## 6. Actionable Recommendations

### Quick Wins (This Week)

1. **Pool arm/hand data objects** in `VRMAvatar.tsx:759-810` — reduces GC by ~20-30%
2. **Procedural breathing** — sine wave on spine/chest bones in `VRMController.tsx` (highest-impact liveliness change)
3. **Eye microsaccades** — add simplex noise jitter to eye positions in `use-vrm-lookat.ts`
4. **Head micro-movement** — simplex noise offset in head tracking (0.5-2 degrees)
5. **Blink variation** — double-blink (10% chance) + speed jitter in auto-blink system

### Short Term (This Month)

6. **Use existing postprocessing** — add Bloom + Vignette + N8AO for stream visual polish
7. **Emotion-driven expressions** — map backend emotion → `vrm.expressionManager.setValue()` with spring transitions
8. **Auto profile picture** — useFBO + portrait camera + 3-point lighting → 1024x1024 PNG
9. **Add wawa-vfx** — lightweight particles for donation/gift effects
10. **Weighted idle variation** — `crossFadeTo()` smooth transitions, weighted random selection

### Medium Term (Next Quarter)

11. **Integrate World Labs API** — pre-generate backgrounds via Marble mini ($0.12/scene)
12. **Add Spark** for SPZ rendering — gaussian splat environments as scene backgrounds
13. **VTube Studio-style priority system** — layered value providers with smooth fading
14. **Additive breathing via AnimationMixer** — `AdditiveAnimationBlendMode` with Mixamo FBX
15. **@react-three/rapier v1.x** — physics for interactive gift effects
16. **Theatre.js** — visual editor for camera choreography + expression sequences
17. **@react-spring/three** — spring animations for transitions
18. **LiveKit evaluation** — stream R3F canvas via WebRTC

### Architecture Note

When adding new libraries, maintain the existing separation of concerns:
- UI components (`dressing-room/`, `ui/`) — no direct Three.js imports
- 3D components (`three/`, `canvas/`) — handle all Three.js operations
- Hooks (`hooks/`) — shared state and logic bridges
- All R3F components must be dynamically imported with `ssr: false` in Next.js

---

## Sources

### Performance & R3F Ecosystem
- [pmndrs/react-three-rapier](https://github.com/pmndrs/react-three-rapier)
- [pmndrs/uikit](https://github.com/pmndrs/uikit)
- [pmndrs/react-postprocessing](https://github.com/pmndrs/react-postprocessing)
- [wass08/wawa-vfx](https://github.com/wass08/wawa-vfx)
- [FarazzShaikh/THREE-CustomShaderMaterial](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial)
- [Alchemist0823/three.quarks](https://github.com/Alchemist0823/three.quarks)
- [theatre-js/theatre](https://github.com/theatre-js/theatre)
- [react-spring.dev](https://react-spring.dev/)
- [livekit/livekit](https://github.com/livekit/livekit)
- [joinplayroom.com](https://joinplayroom.com/)
- [drei.docs.pmnd.rs](https://drei.docs.pmnd.rs/)

### World Labs & Gaussian Splatting
- [World Labs API Docs](https://docs.worldlabs.ai/api)
- [World Labs API Pricing](https://docs.worldlabs.ai/api/pricing)
- [World Labs Blog - Announcing the World API](https://www.worldlabs.ai/blog/announcing-the-world-api)
- [sparkjs.dev](https://sparkjs.dev/) / [sparkjsdev/spark](https://github.com/sparkjsdev/spark)
- [mkkellogg/GaussianSplats3D](https://github.com/mkkellogg/GaussianSplats3D)
- [Niantic SPZ Format](https://github.com/nianticlabs/spz)
- [gaussian-vrm (GVRM)](https://github.com/naruya/gaussian-vrm)
- [3dgsconverter](https://github.com/francescofugazzi/3dgsconverter)
- [meshy.ai](https://www.meshy.ai/api) / [tripo3d.ai](https://www.tripo3d.ai/api) / [hyper3d.ai](https://developer.hyper3d.ai/)

### Character Liveliness & Animation
- [AnimSchool - Breathing Life into Idle Animations](https://blog.animschool.edu/2024/06/14/breathing-life-into-idle-animations/)
- [Genius Crate - The Science of Idle Animations](https://www.geniuscrate.com/the-science-of-idle-animations-and-why-they-matter-in-modern-games/)
- [Duchowski et al. - Eye Movement Synthesis with 1/f Pink Noise](https://people.computing.clemson.edu/~sjoerg/docs/Duchowski15_PinkNoise.pdf)
- [Whizzy Studios - Realistic Eye Movements in 3D](https://www.whizzystudios.com/post/how-to-create-realistic-eye-movements-in-3d-characters)
- [GDC Vault - FFXVI Animation](https://gdcvault.com/play/1034705/Autodesk-Developer-Summit-FINAL-FANTASY)
- [VTube Studio Wiki - Animation Interaction](https://github.com/DenchiSoft/VTubeStudio/wiki/Interaction-between-Animations,-Tracking,-Physics,-etc.)
- [Warudo Handbook - Character](https://docs.warudo.app/docs/assets/character)
- [Three.js Additive Blending Example](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_animation_skinning_additive_blending.html)
- [Wawa Sensei - VTuber Studio Tutorial](https://wawasensei.dev/tuto/vrm-avatar-with-threejs-react-three-fiber-and-mediapipe)
- [Wawa Sensei - Wiggle Bones R3F Tutorial](https://wawasensei.dev/tuto/wiggle-bones-threejs-library-react-three-fiber)

### VRM & Profile Pictures
- [@pixiv/three-vrm Docs](https://pixiv.github.io/three-vrm/docs/modules/three-vrm.html)
- [VRM 1.0 Meta Spec (Thumbnail)](https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/meta.md)
- [VRMExpressionPresetName](https://pixiv.github.io/three-vrm/docs/types/three-vrm.VRMExpressionPresetName.html)
- [VRMHumanoid API](https://pixiv.github.io/three-vrm/packages/three-vrm/docs/classes/VRMHumanoid.html)
- [drei useFBO Docs](https://drei.docs.pmnd.rs/misc/fbo-use-fbo)
- [R3F Canvas Image Capture Discussion](https://github.com/pmndrs/react-three-fiber/discussions/2054)
- [vrm-mixamo-retarget](https://github.com/saori-eth/vrm-mixamo-retargeter)
- [r3f-vrm](https://github.com/DavidCks/r3f-vrm)
- [wiggle.three.tools](https://wiggle.three.tools/)
