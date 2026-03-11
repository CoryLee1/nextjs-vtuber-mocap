import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEchuuWebSocket } from '@/hooks/use-echuu-websocket';

// 4.4 打开分享链接时：URL 带 room_id 则自动进入该直播间（观众）
export function useRoomIdFromUrl() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() || '/zh';
  const { setRoom, connect, ownerToken } = useEchuuWebSocket();
  const appliedRef = useRef(false);
  useEffect(() => {
    if (appliedRef.current) return;
    const urlRoomId = searchParams?.get('room_id')?.trim();
    if (!urlRoomId) return;
    if (ownerToken) return;
    appliedRef.current = true;
    let cancelled = false;
    (async () => {
      const { checkRoomExists, createRoom } = await import('@/lib/echuu-client');
      const exists = await checkRoomExists(urlRoomId);
      if (cancelled) return;
      if (exists) {
        setRoom(urlRoomId, null);
        connect(urlRoomId);
        return;
      }

      // room 失效时自动重建，避免 WS 4004 无限重连
      try {
        const room = await createRoom();
        if (cancelled || !room?.room_id) return;
        setRoom(room.room_id, room.owner_token ?? null);
        connect(room.room_id);
        const params = new URLSearchParams(searchParams?.toString() || '');
        params.set('room_id', room.room_id);
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      } catch {
        // ignore and keep current state
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, setRoom, connect, ownerToken, router, pathname]);
}

// 4.4.1 房主开播或进入房间后，把 room_id 同步到地址栏，这样分享/复制链接会带房间号
export function useSyncRoomIdToUrl() {
  const pathname = usePathname() || '/zh';
  const searchParams = useSearchParams();
  const router = useRouter();
  const { roomId } = useEchuuWebSocket();
  useEffect(() => {
    const currentInUrl = searchParams?.get('room_id')?.trim() || null;
    if (currentInUrl === roomId) return; // 已同步，避免重复 replace
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (roomId) {
      params.set('room_id', roomId);
    } else {
      params.delete('room_id');
    }
    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    router.replace(url, { scroll: false });
  }, [roomId, pathname, searchParams, router]);
}
