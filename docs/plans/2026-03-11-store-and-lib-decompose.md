# Store & Lib Decomposition Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the God store `use-scene-store.ts` (571 lines, 60+ fields) into 3 focused stores, and extract the pure retargeting algorithm from `animation-manager.ts` (1157 lines).

**Architecture:** The scene store has 3 clearly independent domains — Echuu live state, rendering config, and core 3D scene — that share almost no cross-dependencies. After the split, only 5 of 23 consumers need imports from 2+ stores. The animation-manager has a 500-line pure function (`remapAnimationToVrm` + auto-mapper) that can be extracted with zero coupling risk.

**Tech Stack:** Zustand (persist + subscribeWithSelector), Three.js, TypeScript

---

## Guiding Principles

- **Zero behavior change** — each task is a pure move refactor. No logic changes.
- **One commit per extraction** — easy to revert any single move.
- **Verify after each commit** — `npm run build` must succeed (no test framework).
- **Barrel re-export for compatibility** — `use-scene-store.ts` re-exports new stores so existing consumers keep working. Migration of imports is a separate follow-up.

## Cross-Store Concern: `triggerQualityDegradation`

This function lives in core store but sets rendering config fields (`postProcessingEnabled`, `chromaticEnabled`, `handTrailEnabled`, `composerResolutionScale`). After the split it will import and call `useRenderingConfigStore.getState()` directly — a standard Zustand cross-store pattern.

---

### Task 1: Extract rendering config store

The largest isolated slice: 50+ post-processing/rendering fields that only `MainScene.tsx`, `UILayoutRedesign.tsx` (StreamRoomSidebar), `SceneManager.tsx`, `TheatreCamera.tsx`, and `Canvas3DProvider.tsx` consume.

**Files:**
- Create: `src/stores/use-rendering-config-store.ts`
- Modify: `src/hooks/use-scene-store.ts`

**Step 1: Create the new store**

Create `src/stores/use-rendering-config-store.ts` with:
- All fields from the `SceneState` interface lines 150–230 (env, tone mapping, bloom, vignette, chromatic, brightness/contrast/saturation/hue, LUT, hand trail, theatre, avatar position/gizmo, post-processing toggle)
- Also include `hdrUrl`, `sceneFbxUrl` and their setters (lines 144–149) — these are scene environment assets, not live config
- Use `persist` middleware with the same localStorage key subset currently in `partialize`
- Use `subscribeWithSelector` (same middleware stack as original)

Persist fields (copy from original partialize):
```
envBackgroundIntensity, envBackgroundRotation, composerResolutionScale,
chromaticEnabled, chromaticOffset, brightness, contrast, saturation,
postProcessingEnabled, handTrailEnabled, hdrUrl, sceneFbxUrl,
avatarPositionY, avatarGizmoEnabled
```

**Step 2: Remove from use-scene-store.ts**

- Remove the rendering fields from `SceneState` interface (lines 144–230)
- Remove the rendering implementations from the store body (lines 452–509)
- Remove the rendering fields from `partialize`
- Add `triggerQualityDegradation` to import from the new store:
  ```typescript
  triggerQualityDegradation: () => {
    const { default: useRenderingConfigStore } = await import('@/stores/use-rendering-config-store');
    // ... No, Zustand actions are sync. Use direct import instead:
  }
  ```
  Actually: use a top-level import `import { useRenderingConfigStore } from '@/stores/use-rendering-config-store'` and call `useRenderingConfigStore.getState().setPostProcessingEnabled(false)` etc. inside `triggerQualityDegradation`.
- Add barrel re-export at bottom of `use-scene-store.ts`:
  ```typescript
  export { useRenderingConfigStore } from '@/stores/use-rendering-config-store';
  ```

**Step 3: Verify**

Run: `npm run build` — must compile with no errors.

**Step 4: Commit**

```bash
git add src/stores/use-rendering-config-store.ts src/hooks/use-scene-store.ts
git commit -m "refactor: extract useRenderingConfigStore from useSceneStore"
```

---

### Task 2: Extract Echuu live store

The Echuu-specific live streaming state: character config, cue, audio sync, BGM — consumed by `EchuuLiveAudio.tsx`, `BGMPlayer.tsx`, `StreamEndMVP.tsx`, `GoLiveButton.tsx`, and `UILayoutRedesign.tsx` (StreamRoomSidebar).

**Files:**
- Create: `src/stores/use-echuu-config-store.ts`
- Modify: `src/hooks/use-scene-store.ts`

**Step 1: Create the new store**

Create `src/stores/use-echuu-config-store.ts` with:
- `echuuConfig` and `setEchuuConfig` (lines 118–127, 432–438)
- `echuuCue`, `setEchuuCue` (lines 128–129, 440–441)
- `echuuAudioPlaying`, `setEchuuAudioPlaying` (lines 130–131, 442–443)
- `echuuSegmentDurationMs`, `setEchuuSegmentDurationMs` (lines 132–134, 444–445)
- `echuuCaptionText`, `setEchuuCaptionText` (lines 135–137, 446–447)
- `bgmUrl`, `bgmVolume`, `setBgmUrl`, `setBgmVolume` (lines 138–143, 448–451)
- Import `DEFAULT_PREVIEW_MODEL_URL` for echuuConfig default
- Use `persist` middleware; persisted fields: `echuuConfig`, `bgmUrl`, `bgmVolume`

**Step 2: Remove from use-scene-store.ts**

- Remove Echuu fields from `SceneState` interface (lines 117–143)
- Remove Echuu implementations from store body (lines 422–451)
- Remove `echuuConfig`, `bgmUrl`, `bgmVolume` from `partialize`
- Add barrel re-export:
  ```typescript
  export { useEchuuConfigStore } from '@/stores/use-echuu-config-store';
  ```

**Step 3: Verify**

Run: `npm run build` — must compile with no errors.

**Step 4: Commit**

```bash
git add src/stores/use-echuu-config-store.ts src/hooks/use-scene-store.ts
git commit -m "refactor: extract useEchuuConfigStore from useSceneStore"
```

---

### Task 3: Migrate consumers to use new stores directly

After Tasks 1–2, `use-scene-store.ts` re-exports both new stores for backwards compatibility. Now update consumers to import from the correct store directly, removing the barrel dependency.

**Batch A — Pure Echuu consumers (import only useEchuuConfigStore):**
- `src/components/dressing-room/EchuuLiveAudio.tsx`
- `src/components/dressing-room/BGMPlayer.tsx`
- `src/components/dressing-room/StreamEndMVP.tsx`

**Batch B — Pure Rendering consumers (import only useRenderingConfigStore):**
- `src/components/canvas/scenes/TheatreCamera.tsx`

**Batch C — Mixed consumers (import from 2+ stores):**
- `src/components/canvas/scenes/MainScene.tsx` (A + B + C)
- `src/components/dressing-room/UILayoutRedesign.tsx` (A + B)
- `src/components/dressing-room/GoLiveButton.tsx` (A + C)
- `src/components/canvas/SceneManager.tsx` (B + C)
- `src/components/ui/OnboardingGuide.tsx` (A + C — echuuConfig + vrmModelUrl)

For each file:
1. Replace `useSceneStore((s) => s.echuuXxx)` with `useEchuuConfigStore((s) => s.echuuXxx)`
2. Replace `useSceneStore((s) => s.bloomIntensity)` etc. with `useRenderingConfigStore((s) => s.bloomIntensity)`
3. Keep `useSceneStore` import for any core fields still needed
4. Remove `useSceneStore` import entirely if no core fields remain

**Step 1: Migrate Batch A + B** (pure consumers, safest)

**Step 2: Migrate Batch C** (mixed consumers)

**Step 3: Remove barrel re-exports** from `use-scene-store.ts`

**Step 4: Verify**

Run: `npm run build`

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: migrate consumers to use new stores directly"
```

---

### Task 4: Extract animation rig mapper

The first 500 lines of `animation-manager.ts` are a pure, stateless retargeting algorithm with zero React/hook dependencies. Extract as a standalone module.

**Files:**
- Create: `src/lib/animation/rig-mapper.ts`
- Modify: `src/lib/animation-manager.ts`

**Step 1: Create the new module**

Create `src/lib/animation/rig-mapper.ts` with:
- Lines 18–35: `VRM_BONE_NAMES` constant
- Lines 41–70: `SYNONYMS` table
- Lines 72–76: `SIDE_MAP`
- Lines 78–79: `STRIP_PREFIXES`
- Lines 81–82: `_autoMapCache`
- Lines 95–229: `autoMapBoneToVrm()` function
- Lines 240–499: `remapAnimationToVrm()` function
- Lines 502–515: `getVrmId()` helper
- Lines 517–531: `normalizeAnimationUrl()` + `S3_ANIM_BASE` + `DEFAULT_ANIMATION_URL`
- Lines 533–539: `TRANSITION` config

Required imports for the new file:
```typescript
import * as THREE from 'three';
import { MIXAMO_VRM_RIG_MAP, KAWAII_VRM_RIG_MAP, KAWAII_QUAT_SIGN_FLIPS, KAWAII_YUP_QUAT_SIGN_FLIPS, KAWAII_YUP_LOWERLEG_BONES } from '@/lib/constants';
import { detectFbxSceneZUp, convertPositionZUpToYUp, convertQuaternionTrackZUpToYUp, convertQuaternionZUpToYUp } from '@/lib/coordinate-axes';
import { DEFAULT_IDLE_URL } from '@/config/vtuber-animations';
```

Export: `autoMapBoneToVrm`, `remapAnimationToVrm`, `getVrmId`, `normalizeAnimationUrl`, `TRANSITION`, `VRM_BONE_NAMES`

**Step 2: Update animation-manager.ts**

Replace lines 1–539 with:
```typescript
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { AnimationMixer, LoopRepeat, AnimationUtils } from 'three';
import * as THREE from 'three';
import { useFBX } from '@react-three/drei';
import { remapAnimationToVrm, getVrmId, normalizeAnimationUrl, TRANSITION } from '@/lib/animation/rig-mapper';
import { DEFAULT_IDLE_URL } from '@/config/vtuber-animations';

export { remapAnimationToVrm } from '@/lib/animation/rig-mapper';

const DEFAULT_ANIMATION_URL = DEFAULT_IDLE_URL;
```

Keep `useAnimationManager` hook (lines 546–1157) unchanged.

**Step 3: Verify**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/lib/animation/rig-mapper.ts src/lib/animation-manager.ts
git commit -m "refactor: extract animation rig mapper from animation-manager"
```

---

### Task 5: Final cleanup and verification

**Step 1: Check file sizes**

```bash
wc -l src/hooks/use-scene-store.ts src/stores/use-rendering-config-store.ts src/stores/use-echuu-config-store.ts src/lib/animation-manager.ts src/lib/animation/rig-mapper.ts
```

Expected:
| File | Estimated Lines |
|------|----------------|
| `use-scene-store.ts` | ~220 (core scene only) |
| `use-rendering-config-store.ts` | ~180 |
| `use-echuu-config-store.ts` | ~80 |
| `animation-manager.ts` | ~620 (hook only) |
| `animation/rig-mapper.ts` | ~540 (pure functions) |

**Step 2: Verify all imports resolve**

```bash
grep -rn "from.*use-scene-store" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
grep -rn "from.*use-rendering-config-store" src/ --include="*.tsx" --include="*.ts"
grep -rn "from.*use-echuu-config-store" src/ --include="*.tsx" --include="*.ts"
grep -rn "from.*animation/rig-mapper" src/ --include="*.tsx" --include="*.ts"
```

**Step 3: Full build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: final cleanup after store and lib decomposition"
```

---

## Verification Checklist (after all tasks)

1. `npm run build` compiles without errors
2. `use-scene-store.ts` no longer contains any Echuu or rendering config fields
3. No circular imports between the 3 stores
4. `triggerQualityDegradation` in core store correctly calls rendering config store
5. `animation-manager.ts` no longer contains `autoMapBoneToVrm` or `remapAnimationToVrm`
6. `remapAnimationToVrm` is still importable from `animation-manager.ts` (re-export)
7. All 23 consumer files import from the correct store(s)

## File Size After Decomposition

| File | Before | After |
|------|--------|-------|
| `use-scene-store.ts` | 571 | ~220 |
| `use-rendering-config-store.ts` | — | ~180 |
| `use-echuu-config-store.ts` | — | ~80 |
| `animation-manager.ts` | 1157 | ~620 |
| `animation/rig-mapper.ts` | — | ~540 |
| **Total** | **1728** | **~1640** (same code, better organized) |

## Consumer Migration Impact

| Store | Consumers |
|-------|-----------|
| `useSceneStore` (core) | 17 files (down from 23) |
| `useRenderingConfigStore` | 5 files |
| `useEchuuConfigStore` | 8 files |
| Cross-store (2+) | 5 files |
