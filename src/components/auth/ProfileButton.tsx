"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read_failed'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

async function compressImageToDataUrl(file: File, maxSize = 256, quality = 0.82): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('image_load_failed'));
    img.src = dataUrl;
  });

  const { width, height } = img;
  const scale = Math.min(1, maxSize / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_context_failed');
  ctx.drawImage(img, 0, 0, targetW, targetH);

  return canvas.toDataURL('image/jpeg', quality);
}

export function ProfileButton() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;

  const initialName = useMemo(() => (user?.name ?? ''), [user?.name]);
  const initialImage = useMemo(() => (user?.image ?? ''), [user?.image]);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [image, setImage] = useState(initialImage);
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 外部头像（如 Google OAuth）在同源代理下请求，避免 COEP 拦截
  const rawAvatar = !imgError && (image || initialImage) ? (image || initialImage) : '';
  const isExternalAvatar =
    typeof rawAvatar === 'string' &&
    rawAvatar.startsWith('http') &&
    !rawAvatar.startsWith(typeof window !== 'undefined' ? window.location.origin : '');
  const avatarSrc = rawAvatar
    ? isExternalAvatar
      ? `/api/avatar-proxy?url=${encodeURIComponent(rawAvatar)}`
      : rawAvatar
    : '/images/CoryProfile.png';

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const userProfile = data?.user;
        if (userProfile?.name != null) setName(userProfile.name);
        if (userProfile?.image != null) {
          setImgError(false);
          setImage(userProfile.image);
        }
      })
      .catch(() => null);
  }, [status]);

  if (status !== 'authenticated') return null;

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (v) {
        // 打开时同步最新 session 值
        setName(user?.name ?? '');
        setImage(user?.image ?? '');
      }
    }}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-16 h-16 rounded-full overflow-hidden bg-white/10 border border-white/10 shadow-xl hover:scale-105 active:scale-95 transition-all"
          title="Profile"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarSrc}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>个人资料</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-full overflow-hidden bg-black/10 border border-white/10 hover:scale-105 active:scale-95 transition-all"
              title="点击更换头像"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarSrc}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            </button>
            <div className="flex-1 space-y-2">
              <div className="text-xs text-muted-foreground">点击头像更换（本地图片，会保存到你的用户资料）</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const dataUrl = await compressImageToDataUrl(file);
                    setImgError(false);
                    setImage(dataUrl);
                  } catch {
                    setSaveError('头像压缩失败，请换一张图片');
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">昵称</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="你的昵称" />
          </div>
        </div>

        {saveError && (
          <div className="text-xs text-red-400">{saveError}</div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              await signOut({ callbackUrl: '/zh' });
            }}
          >
            登出
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              setSaveError(null);
              try {
                const res = await fetch('/api/profile', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, image }),
                });
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  setSaveError(data?.error || '保存失败');
                  return;
                }
                setOpen(false);
                router.refresh();
              } finally {
                setSaving(false);
              }
            }}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

