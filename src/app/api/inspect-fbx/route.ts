/**
 * Dev-only: 解析 FBX 并返回动画 track 的骨骼名，用于多 rig 映射表制作。
 * GET /api/inspect-fbx?path=/models/animations/kawaii-test/@KA_Idle51_StandingTalk1_2.FBX
 */
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const pathParam = request.nextUrl.searchParams.get('path');
  if (!pathParam || !pathParam.startsWith('/models/'))
    return NextResponse.json({ error: 'path required, e.g. path=/models/animations/kawaii-test/file.FBX' }, { status: 400 });

  try {
    const publicDir = path.join(process.cwd(), 'public');
    const filePath = path.join(publicDir, pathParam.replace(/^\//, '').split('?')[0]);
    if (!filePath.startsWith(publicDir))
      return NextResponse.json({ error: 'path must be under /models/' }, { status: 400 });

    const buf = await readFile(filePath);
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
    const loader = new FBXLoader();
    const group = loader.parse(arrayBuffer, path.dirname(filePath));

    const clips = group?.animations ?? [];
    const tracksByClip = clips.map((clip: { name: string; tracks: { name: string }[] }) => ({
      name: clip.name,
      trackNames: clip.tracks.map((t: { name: string }) => t.name),
      boneNames: [...new Set(clip.tracks.map((t: { name: string }) => t.name.replace(/\.[^.]+$/, '')))],
    }));

    const allBoneNames = clips.length
      ? [...new Set(clips[0].tracks.map((t: { name: string }) => t.name.replace(/\.[^.]+$/, '')))]
      : [];

    return NextResponse.json({
      success: true,
      file: pathParam,
      clipCount: clips.length,
      clips: tracksByClip,
      boneNames: allBoneNames.sort(),
      sceneNodeNames: group ? collectNodeNames(group as { children?: unknown[]; name?: string }, []) : [],
    });
  } catch (e) {
    console.error('inspect-fbx:', e);
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
    }, { status: 500 });
  }
}

function collectNodeNames(node: { children?: unknown[]; name?: string }, out: string[]): string[] {
  if (node.name) out.push(node.name);
  if (Array.isArray(node.children)) for (const c of node.children) collectNodeNames(c as { children?: unknown[]; name?: string }, out);
  return out;
}
