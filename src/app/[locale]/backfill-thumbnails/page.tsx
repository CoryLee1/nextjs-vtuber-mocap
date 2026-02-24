'use client';

/**
 * 强制重新生成所有 VRM 缩略图（大头照，灰白背景）
 * 访问此页面即自动执行，无需点击按钮
 * 用法：npm run dev 后打开 /zh/backfill-thumbnails 或 /en/backfill-thumbnails
 */

import React, { useEffect, useState } from 'react';
import { backfillVrmThumbnails } from '@/lib/backfill-vrm-thumbnails';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function BackfillThumbnailsPage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<{ ok: number; fail: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'idle') return;
    setStatus('running');
    setProgress('正在获取模型列表…');

    backfillVrmThumbnails(
      (p) => {
        setProgress(
          `${p.current}/${p.total} ${p.modelName} ${p.success ? '✓' : '✗ ' + (p.error || '')}`
        );
      },
      { forceRegenerate: true }
    )
      .then((res) => {
        setResult(res);
        setStatus('done');
        setProgress('');
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      });
  }, [status]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-center">强制重新生成缩略图</h1>
        <p className="text-slate-400 text-sm text-center">
          对所有 S3 模型重新拍大头照（灰白背景），覆盖已有缩略图
        </p>

        {status === 'running' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-sky-400" />
            <p className="text-sm text-slate-300 font-mono truncate w-full text-center" title={progress}>
              {progress}
            </p>
          </div>
        )}

        {status === 'done' && result && (
          <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-slate-800/50 border border-slate-700">
            <CheckCircle className="h-12 w-12 text-green-400" />
            <p className="text-lg font-medium">完成</p>
            <p className="text-slate-400">
              成功 {result.ok}，失败 {result.fail}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-red-900/20 border border-red-800">
            <XCircle className="h-12 w-12 text-red-400" />
            <p className="text-lg font-medium text-red-300">执行失败</p>
            <p className="text-sm text-red-200/80 break-all">{error}</p>
          </div>
        )}

        <p className="text-xs text-slate-500 text-center">
          请确保 dev 服务已启动，且 /api/s3/resources 与 /api/s3/upload 可访问
        </p>
      </div>
    </div>
  );
}
