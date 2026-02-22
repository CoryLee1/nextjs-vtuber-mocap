'use client';

import React, { memo, useEffect, useRef, useCallback } from 'react';
import { useEchuuWebSocket } from '@/hooks/use-echuu-websocket';

const CURSOR_THROTTLE_MS = 100;
const CURSOR_STALE_MS = 3000;
const BUN_CURSOR_URL = '/cursors/bun.png';

/**
 * 直播间内：1）发送本机光标位置；2）渲染其他观众的光标（包子图）。本机使用系统默认光标。
 * 后端需广播 type: 'cursor', viewer_id, x, y。
 */
export const RoomCursors = memo(function RoomCursors() {
  const { roomId, connectionState, otherCursors, sendCursor } = useEchuuWebSocket();
  const lastSendRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const isInRoom = Boolean(roomId && connectionState === 'connected');

  const sendCursorThrottled = useCallback(
    (clientX: number, clientY: number) => {
      if (!isInRoom) return;
      const now = Date.now();
      if (now - lastSendRef.current < CURSOR_THROTTLE_MS) {
        if (rafRef.current == null) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const x = typeof window !== 'undefined' ? clientX / window.innerWidth : 0;
            const y = typeof window !== 'undefined' ? clientY / window.innerHeight : 0;
            sendCursor(x, y);
            lastSendRef.current = Date.now();
          });
        }
        return;
      }
      lastSendRef.current = now;
      const x = typeof window !== 'undefined' ? clientX / window.innerWidth : 0;
      const y = typeof window !== 'undefined' ? clientY / window.innerHeight : 0;
      sendCursor(x, y);
    },
    [isInRoom, sendCursor]
  );

  useEffect(() => {
    if (!isInRoom) return;
    const onMove = (e: MouseEvent) => sendCursorThrottled(e.clientX, e.clientY);
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [isInRoom, sendCursorThrottled]);

  if (!isInRoom) return null;

  const now = Date.now();
  const entries = Object.entries(otherCursors).filter(
    ([, v]) => v && now - v.updatedAt < CURSOR_STALE_MS
  );

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[100]"
      aria-hidden
    >
      {entries.map(([viewerId, { x, y }]) => (
        <div
          key={viewerId}
          className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${x * 100}%`,
            top: `${y * 100}%`,
          }}
        >
          <img
            src={BUN_CURSOR_URL}
            alt=""
            className="w-full h-full object-contain pointer-events-none select-none"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
});
