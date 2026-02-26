/**
 * POST /api/vrm/tag-model
 * 使用 Qwen VL 分析 VRM 缩略图，生成 gender、attributes、suggestedVoice，写入 S3 vrm/xxx_meta.json
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { DEFAULT_TTS_VOICE, ECHUU_AGENT_TTS_VOICES, normalizeGender, normalizeModelName, normalizeVoice } from '@/lib/ai-tag-taxonomy';
import { prisma } from '@/lib/prisma';
import { getSessionUserId } from '@/lib/server-session';

export const dynamic = 'force-dynamic';

const BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'nextjs-vtuber-assets';
const REGION = process.env.NEXT_PUBLIC_S3_REGION || 'us-east-2';
const DEFAULT_DASHSCOPE_BASE = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const DEFAULT_VL_MODEL = 'qwen-vl-max-latest';

const PROMPT = `你是一个资深二次元角色鉴赏家/AI 助手。请用最地道的 ACGN (Anime, Comic, Game, Novel) 术语分析这张 VRM 模型的头像缩略图。
请返回 JSON，格式严格如下：
{"name":"英文角色名","gender":"male|female|nonbinary","identity":"二次元萌属性/职业","styleTags":["tag1","tag2"],"suggestedVoice":"音色名","voiceConfidence":0.0}

详细要求：
- name: 为角色取一个好听的英文名（或是日文罗马音），要符合二次元轻小说或动漫角色的命名风格，拒绝 generic name。
- gender: 角色性别，仅限 male/female/nonbinary。
- identity: 角色的核心身份或萌属性（如 magical_girl, student_council_president, isekai_hero, shrine_maiden, cyber_ninja 等）。
- styleTags: 2-6 个最能描述其“萌点”的英文标签。请优先使用 Danbooru/Pixiv 风格的通用 tag，例如：
  - 外貌/属性: nekomimi (猫耳), megane (眼镜), twintails (双马尾), ahoge (呆毛), heterochromia (异色瞳), zettai_ryouiki (绝对领域)
  - 风格/气质: tsundere (傲娇), kuudere (三无), yandere (病娇), genki (元气), chuunibyou (中二病), yamato_nadeshiko (大和抚子)
  - 服装: seifuku (制服), maid (女仆), gothic_lolita (哥特萝莉), techwear (机能风), kimono (和服)
- suggestedVoice: 从以下 Qwen TTS 音色中选最匹配的一个（根据角色的气质，比如傲娇选 Cherry/Vivian，御姐选 Serena/Maia，元气选 Momo/Bella，少年选 Ethan/Ryan，温柔选 Ono Anna/Sohee）：${ECHUU_AGENT_TTS_VOICES.join(',')}
- voiceConfidence: 0~1 的置信度。

只返回 JSON，不要包含 markdown 格式或其他文字。`;

interface TagResult {
  s3Key: string;
  ok: boolean;
  error?: string;
  meta?: {
    name: string;
    gender: 'male' | 'female' | 'nonbinary';
    identity: string;
    styleTags: string[];
    suggestedVoice: string;
    voiceConfidence: number;
    taxonomyVersion: number;
  };
}

function getS3Client() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not configured');
  }
  return new S3Client({
    region: REGION,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function s3KeyToModelName(key: string): string {
  const filename = key.split('/').pop() || key;
  return filename.replace(/\.vrm$/i, '');
}

function parseTagResponse(
  text: string,
  fallbackName: string
): {
  name: string;
  gender: 'male' | 'female' | 'nonbinary';
  identity: string;
  styleTags: string[];
  suggestedVoice: string;
  voiceConfidence: number;
  taxonomyVersion: number;
} | null {
  try {
    const json = JSON.parse(text.trim()) as {
      name?: string;
      gender?: string;
      identity?: string;
      styleTags?: string[];
      attributes?: string[];
      suggestedVoice?: string;
      voiceConfidence?: number;
    };
    const styleTagsRaw = Array.isArray(json.styleTags)
      ? json.styleTags
      : (Array.isArray(json.attributes) ? json.attributes : []);
    const styleTags = styleTagsRaw
      .map((t) => String(t).trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 8);

    const confidenceRaw = Number(json.voiceConfidence);
    const voiceConfidence = Number.isFinite(confidenceRaw)
      ? Math.max(0, Math.min(1, confidenceRaw))
      : 0.7;

    return {
      name: normalizeModelName(json.name, fallbackName),
      gender: normalizeGender(json.gender),
      identity: String(json.identity ?? '').trim().toLowerCase() || 'vtuber',
      styleTags,
      suggestedVoice: normalizeVoice(json.suggestedVoice ?? DEFAULT_TTS_VOICE),
      voiceConfidence,
      taxonomyVersion: 2,
    };
  } catch {
    return null;
  }
}

function extractAssistantText(content: unknown): string | null {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const text = content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'text' in item) return String((item as any).text ?? '');
        return '';
      })
      .join('\n')
      .trim();
    return text || null;
  }
  return null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: 0, fail: 0, results: [], error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.DASHSCOPE_API_KEY;
  const dashscopeBase = process.env.DASHSCOPE_BASE_URL || DEFAULT_DASHSCOPE_BASE;
  const vlModel = process.env.DASHSCOPE_VL_MODEL || DEFAULT_VL_MODEL;
  if (!apiKey) {
    return NextResponse.json({ ok: 0, fail: 0, results: [], error: 'DASHSCOPE_API_KEY not configured' }, { status: 500 });
  }

  let body: { s3Key?: string; s3Keys?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: 0, fail: 0, results: [], error: 'Invalid JSON body' }, { status: 400 });
  }

  const keys: string[] = [];
  if (body.s3Key && typeof body.s3Key === 'string') keys.push(body.s3Key);
  if (Array.isArray(body.s3Keys)) keys.push(...body.s3Keys.filter((k): k is string => typeof k === 'string'));
  const uniqueKeys = [...new Set(keys)].filter(
    (k) =>
      k &&
      (k.startsWith('vrm/') || /^user\/[^/]+\/vrm\/.+$/i.test(k)) &&
      k.toLowerCase().endsWith('.vrm')
  );

  if (uniqueKeys.length === 0) {
    return NextResponse.json({ ok: 0, fail: 0, results: [], error: 'Missing s3Key or s3Keys' }, { status: 400 });
  }

  const s3 = getS3Client();
  const results: TagResult[] = [];
  let ok = 0;
  let fail = 0;

  for (const s3Key of uniqueKeys) {
    const modelName = s3KeyToModelName(s3Key);
    const thumbKey = s3Key.replace(/\.vrm$/i, '_thumb.png');
    const metaKey = s3Key.replace(/\.vrm$/i, '_meta.json');

    try {
      const asset = await prisma.asset.findUnique({ where: { s3Key } });
      if (!asset) {
        results.push({ s3Key, ok: false, error: 'Asset not found' });
        fail++;
        continue;
      }
      if (asset.ownerUserId !== userId) {
        results.push({ s3Key, ok: false, error: 'Forbidden' });
        fail++;
        continue;
      }

      // 1. 检查缩略图是否存在
      try {
        await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: thumbKey }));
      } catch {
        results.push({ s3Key, ok: false, error: 'No thumbnail' });
        fail++;
        continue;
      }

      // 2. 拉取缩略图
      const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: thumbKey });
      const obj = await s3.send(getCmd);
      if (!obj.Body) {
        results.push({ s3Key, ok: false, error: 'Empty thumbnail' });
        fail++;
        continue;
      }
      const buf = await obj.Body.transformToByteArray();
      const base64 = Buffer.from(buf).toString('base64');
      const dataUrl = `data:image/png;base64,${base64}`;

      // 3. 调用 Qwen VL
      const vlRes = await fetch(`${dashscopeBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: vlModel,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: PROMPT },
                { type: 'image_url', image_url: { url: dataUrl } },
              ],
            },
          ],
          max_tokens: 256,
        }),
      });

      if (!vlRes.ok) {
        const errText = await vlRes.text();
        console.error('[tag-model] VL API failed:', {
          status: vlRes.status,
          model: vlModel,
          base: dashscopeBase,
          body: errText.slice(0, 1000),
          s3Key,
        });
        results.push({ s3Key, ok: false, error: `VL API ${vlRes.status}: ${errText.slice(0, 200)}` });
        fail++;
        continue;
      }

      const vlJson = await vlRes.json();
      const choice = vlJson?.choices?.[0];
      const content = extractAssistantText(choice?.message?.content);
      if (!content) {
        console.error('[tag-model] Empty VL response content:', {
          model: vlModel,
          base: dashscopeBase,
          response: vlJson,
          s3Key,
        });
        results.push({ s3Key, ok: false, error: 'Empty VL response' });
        fail++;
        continue;
      }

      // 4. 解析 JSON（可能被 markdown 包裹）
      let raw = content.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) raw = jsonMatch[0];
      const meta = parseTagResponse(raw, modelName);
      if (!meta) {
        results.push({ s3Key, ok: false, error: 'Invalid JSON: ' + content.slice(0, 100) });
        fail++;
        continue;
      }

      // 5. 写入 S3 _meta.json
      const metaBody = JSON.stringify(meta);
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: metaKey,
          Body: metaBody,
          ContentType: 'application/json',
        })
      );

      results.push({ s3Key, ok: true, meta });
      ok++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ s3Key, ok: false, error: msg });
      fail++;
    }
  }

  return NextResponse.json({ ok, fail, results });
}
