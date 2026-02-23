# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 14 VTuber motion capture app that animates 3D VRM avatars in real-time using webcam input. The pipeline: Camera -> MediaPipe (face/body/hand detection) -> Kalidokit (landmark-to-rotation conversion) -> VRM model rendering via Three.js.

## Commands

```bash
npm run dev              # Dev server (4GB memory)
npm run dev:low-memory   # Dev server (2GB memory)
npm run build            # Production build
npm run lint             # ESLint
npm run clean:win        # Clear .next and webpack cache (Windows)
npm run clean            # Clear cache (Unix)
```

No test framework is configured.

## Architecture

### Data Flow (Unidirectional)
```
Camera Input -> MediaPipe Holistic -> Kalidokit -> VRM Bone Mapping -> Three.js Render
```

### Key Entry Points
- `src/components/dressing-room/VTuberApp.tsx` - Main app container, integrates all feature components
- `src/components/dressing-room/VRMAvatar.tsx` - VRM rendering and motion capture application
- `src/hooks/use-scene-store.ts` - Zustand store for global scene state (VRM model cache, camera settings, debug settings, MediaPipe callbacks)
- `src/lib/mocap/vrm-adapter.ts` - Kalidokit-to-VRM bone mapping
- `src/lib/animation-manager.ts` - FBX/Mixamo → VRM animation retargeting (see `docs/mixamo-vrm-retargeting.md`)

### Routing
- **Next.js App Router** with `next-intl` for i18n
- Locales: `zh` (default), `en`, `ja` - routes are `/{locale}/v1/*`
- `middleware.ts` handles locale detection and routing
- V1 UI pages live under `src/app/v1/` (live, settings, auth, loading variants)
- API routes: `src/app/api/` (S3 upload/presigned-url, Stripe payments, debug-env)

### Component Organization
- `src/components/dressing-room/` - Main feature components (VTuberApp, VRMAvatar, CameraWidget, ModelManager, ControlPanel)
- `src/components/ui/` - shadcn/ui component library
- `src/components/three/` - Three.js scene components
- `src/components/debug/` - Debug panels
- `src/components/tracking/` - PostHog analytics components

### State Management
- **Zustand** (`useSceneStore`) for global state: VRM model, camera settings, debug settings, scene refs
- **useRef** for high-frequency mocap data (never `useState` in animation loops)
- `subscribeWithSelector` middleware for reactive subscriptions without re-renders

### Key Libraries
- `@pixiv/three-vrm` (3.4) - VRM 0.x and 1.0 model loading
- `@react-three/fiber` (8.18) + `@react-three/drei` (9.122) - React Three.js renderer
- `@mediapipe/holistic` - Pose/face/hand detection
- `kalidokit` - MediaPipe landmark to bone rotation conversion
- `leva` - Debug GUI controls
- `zustand` (4.4) - State management
- `next-intl` (4.3) - Internationalization

## Critical Patterns

### VRM Model Orientation
VRM 0.x faces -Z, VRM 1.0 faces +Z. Always call `VRMUtils.rotateVRM0(vrm)` during initialization to handle this. The `axisSettings` config is for mocap-to-bone mapping, NOT for fixing model orientation.

### Performance in Animation Loops
- Use object pooling (reuse `Vector3`, `Quaternion`, `Euler` objects) - never allocate in `useFrame`
- Store mocap data in `useRef`, never `useState` (avoids 60fps re-renders)
- Cache bone references to avoid repeated lookups
- Three.js components must use `React.memo`
- Never call `setState` inside `useFrame` callbacks

### Separation of Concerns
- UI components (`dressing-room/`, `ui/`) must NOT import Three.js directly
- 3D components (`three/`) handle all Three.js operations
- Mocap processing logic lives in `lib/mocap/`
- VRM utilities in `lib/vrm/` (bone mapping, capabilities detection)

### Coordinate Axis Mapping
Mocap data requires coordinate transformation for VRM bones:
- Arms: `X: -1, Y: 1, Z: -1`
- Hands: `X: -1, Y: 1, Z: -1`
- Finger mapping is under active debugging

## Configuration

### Path Aliases (tsconfig.json)
`@/*` -> `./src/*` (also `@/components/*`, `@/hooks/*`, `@/lib/*`, `@/types/*`, `@/providers/*`, `@/app/*`)

### TypeScript
- `strict: false`, `noImplicitAny: false` - relaxed type checking
- Build ignores TS and ESLint errors (`ignoreBuildErrors: true`)

### next.config.js
- CORS headers required for MediaPipe (`Cross-Origin-Embedder-Policy`, `Cross-Origin-Opener-Policy`)
- Webpack configured to handle `.fbx`, `.vrm`, `.glb`, `.gltf` files via file-loader
- PostHog proxied through `/ingest/*` rewrites
- Client-side fallbacks: `fs`, `path`, `crypto`, `stream`, `buffer` set to `false`

### Tailwind
- Custom `vtuber.*` color palette (blues/cyans)
- Dark mode via `class` strategy
- shadcn/ui CSS variable-based theming
- Custom animation utilities (`animation-delay-*`)

### S3 asset paths (nextjs-vtuber-assets)
- **Models (VRM)**: `s3://nextjs-vtuber-assets/vrm/` — use key `vrm/ModelName.vrm` with `getS3ObjectReadUrlByKey('vrm/xxx.vrm')`.
- **Animations (FBX)**: `s3://nextjs-vtuber-assets/animations/` — use key `animations/FileName.fbx`. See `.cursor/rules/s3-asset-paths.mdc`.

## PostHog Analytics Rules
(From `.cursor/rules/posthog-integration.mdc`)
- Never hardcode API keys - use `.env` values
- Feature flag names: store in enums/const objects with `UPPERCASE_WITH_UNDERSCORE`
- Custom property names: use enums if referenced in 2+ places
- Consult existing naming conventions before creating new event/property names

## Documentation
- **Mixamo → VRM retargeting**: `docs/mixamo-vrm-retargeting.md` — 参考依据、实现要点、经验总结；修改重定向逻辑时需遵守该文档与 `.cursor/rules/mixamo-vrm-retarget.mdc`。
- **多源 Rig → VRM（KAWAII / UE4 等）**: `docs/animation-retargeting-multi-rig.md` — 通用经验、新增 rig 的标准流程、KAWAII 的骨骼与 Z-up 处理；避免每种动画都重新研究 mapping。
- **对不齐/扭曲原因与工作流**: `docs/retargeting-why-and-workflow.md` — 三类原因（坐标系、映射、per-bone 符号）、所需数据、推荐排查与修正流程。

## Known Issues
- Finger joint mapping needs per-finger debugging for correct bending direction
- Language switching may have configuration issues with next-intl
