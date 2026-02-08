"use client";

import React, { useMemo, useState } from 'react';
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

  if (status !== 'authenticated') return null;

  const avatarSrc = image || initialImage || '/images/CoryProfile.png';

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
          <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>个人资料</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-black/10 border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="text-xs text-muted-foreground">更换头像（本地图片，会保存到你的用户资料）</div>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const dataUrl = await fileToDataUrl(file);
                  setImage(dataUrl);
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">昵称</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="你的昵称" />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              await signOut({ callbackUrl: '/v1/auth/login' });
            }}
          >
            登出
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await fetch('/api/profile', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, image }),
                });
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

